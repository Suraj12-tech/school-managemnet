package com.schoolenterprise.finance.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.finance.entity.*;
import com.schoolenterprise.finance.repository.*;
import com.schoolenterprise.finance.util.FeeCalculator;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final FeeHeadRepository feeHeadRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final FeeStructureItemRepository feeStructureItemRepository;
    private final StudentFeeAccountRepository accountRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final ReceiptRepository receiptRepository;
    private final ConcessionRepository concessionRepository;
    private final RefundRepository refundRepository;
    private final StudentRepository studentRepository;
    private final SchoolService schoolService;
    private final AuditService auditService;

    public List<FeeHead> feeHeads() {
        return feeHeadRepository.findAll();
    }

    public FeeHead saveFeeHead(FeeHead head) {
        if (head.getSchoolId() == null) {
            head.setSchoolId(schoolService.getSchool().getId());
        }
        FeeHead saved = feeHeadRepository.save(head);
        auditService.record("fees", "edit", "FeeHead", saved.getId(), saved.getName());
        return saved;
    }

    public List<FeeStructure> structures() {
        return feeStructureRepository.findAll();
    }

    public FeeStructure saveStructure(FeeStructure structure) {
        if (structure.getCategory() == null) {
            structure.setCategory("GENERAL");
        }
        FeeStructure saved = feeStructureRepository.save(structure);
        auditService.record("fees", "edit", "FeeStructure", saved.getId(), saved.getName());
        return saved;
    }

    public List<FeeStructureItem> structureItems(Long structureId) {
        return feeStructureItemRepository.findByFeeStructureId(structureId);
    }

    public FeeStructureItem saveItem(FeeStructureItem item) {
        return feeStructureItemRepository.save(item);
    }

    public StudentFeeAccount account(Long studentId, Long yearId) {
        return accountRepository.findByStudentIdAndAcademicYearId(studentId, yearId)
                .orElseGet(() -> createAccount(studentId, yearId));
    }

    public List<StudentFeeAccount> accounts(Long yearId) {
        if (yearId == null) {
            return accountRepository.findAll();
        }
        return accountRepository.findByAcademicYearId(yearId);
    }

    @Transactional
    public Invoice createInvoiceFromStructure(Long studentId, Long structureId, LocalDate dueDate) {
        studentRepository.findById(studentId).orElseThrow(() -> AppException.notFound("Student not found"));
        FeeStructure structure = feeStructureRepository.findById(structureId)
                .orElseThrow(() -> AppException.notFound("Fee structure not found"));
        List<FeeStructureItem> items = feeStructureItemRepository.findByFeeStructureId(structureId);
        if (items.isEmpty()) {
            throw AppException.badRequest("Fee structure has no items");
        }

        BigDecimal total = items.stream().map(FeeStructureItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Invoice invoice = new Invoice();
        invoice.setStudentId(studentId);
        invoice.setAcademicYearId(structure.getAcademicYearId());
        invoice.setInvoiceNumber(nextInvoiceNumber());
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(dueDate);
        invoice.setTotalAmount(total);
        invoice.setStatus("UNPAID");
        invoice = invoiceRepository.save(invoice);

        for (FeeStructureItem item : items) {
            InvoiceItem row = new InvoiceItem();
            row.setInvoiceId(invoice.getId());
            row.setFeeHeadId(item.getFeeHeadId());
            row.setAmount(item.getAmount());
            invoiceItemRepository.save(row);
        }

        StudentFeeAccount acc = account(studentId, structure.getAcademicYearId());
        acc.setTotalDue(acc.getTotalDue().add(total));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "create", "Invoice", invoice.getId(), invoice.getInvoiceNumber());
        return invoice;
    }

    public List<Invoice> invoices(Long studentId) {
        if (studentId == null) {
            return invoiceRepository.findAll();
        }
        return invoiceRepository.findByStudentId(studentId);
    }

    public List<InvoiceItem> invoiceItems(Long invoiceId) {
        return invoiceItemRepository.findByInvoiceId(invoiceId);
    }

    @Transactional
    public Receipt recordPayment(Long invoiceId, BigDecimal amount, String method, String reference) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> AppException.notFound("Invoice not found"));
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Payment amount must be greater than 0");
        }

        BigDecimal alreadyPaid = paymentRepository.findByInvoiceId(invoiceId).stream()
                .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (alreadyPaid.add(amount).compareTo(invoice.getTotalAmount()) > 0) {
            throw AppException.badRequest("Payment exceeds invoice total");
        }

        Payment payment = new Payment();
        payment.setInvoiceId(invoiceId);
        payment.setAmount(amount);
        payment.setMethod(method);
        payment.setPaidOn(LocalDate.now());
        payment.setReferenceNo(reference);
        payment = paymentRepository.save(payment);

        Receipt receipt = new Receipt();
        receipt.setPaymentId(payment.getId());
        receipt.setReceiptNumber(nextReceiptNumber());
        receipt.setIssuedOn(LocalDate.now());
        receipt = receiptRepository.save(receipt);

        invoice.setStatus(FeeCalculator.invoiceStatus(invoice.getTotalAmount(), alreadyPaid.add(amount)));
        invoiceRepository.save(invoice);

        StudentFeeAccount acc = account(invoice.getStudentId(), invoice.getAcademicYearId());
        acc.setTotalPaid(acc.getTotalPaid().add(amount));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "create", "Payment", payment.getId(), receipt.getReceiptNumber());
        return receipt;
    }

    public List<Payment> payments(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public List<Receipt> receipts() {
        return receiptRepository.findAll();
    }

    @Transactional
    public Concession applyConcession(Long studentId, Long yearId, BigDecimal amount, String reason, Long approvedBy) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Concession amount must be greater than 0");
        }
        Concession concession = new Concession();
        concession.setStudentId(studentId);
        concession.setAcademicYearId(yearId);
        concession.setAmount(amount);
        concession.setReason(reason);
        concession.setApprovedBy(approvedBy);
        concession = concessionRepository.save(concession);

        StudentFeeAccount acc = account(studentId, yearId);
        acc.setConcessionAmount(acc.getConcessionAmount().add(amount));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "approve", "Concession", concession.getId(), amount.toPlainString());
        return concession;
    }

    @Transactional
    public Refund refund(Long paymentId, BigDecimal amount, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> AppException.notFound("Payment not found"));
        if (amount.compareTo(payment.getAmount()) > 0) {
            throw AppException.badRequest("Refund cannot exceed payment");
        }
        Refund refund = new Refund();
        refund.setPaymentId(paymentId);
        refund.setAmount(amount);
        refund.setReason(reason);
        refund.setRefundedOn(LocalDate.now());
        refund = refundRepository.save(refund);

        Invoice invoice = invoiceRepository.findById(payment.getInvoiceId()).orElseThrow();
        StudentFeeAccount acc = account(invoice.getStudentId(), invoice.getAcademicYearId());
        acc.setTotalPaid(acc.getTotalPaid().subtract(amount));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "edit", "Refund", refund.getId(), amount.toPlainString());
        return refund;
    }

    public List<StudentFeeAccount> dues() {
        return accountRepository.findAll().stream()
                .filter(a -> a.getOutstanding().compareTo(BigDecimal.ZERO) > 0)
                .toList();
    }

    private StudentFeeAccount createAccount(Long studentId, Long yearId) {
        StudentFeeAccount acc = new StudentFeeAccount();
        acc.setStudentId(studentId);
        acc.setAcademicYearId(yearId);
        acc.setTotalDue(BigDecimal.ZERO);
        acc.setTotalPaid(BigDecimal.ZERO);
        acc.setConcessionAmount(BigDecimal.ZERO);
        acc.setOutstanding(BigDecimal.ZERO);
        return accountRepository.save(acc);
    }

    private void refreshOutstanding(StudentFeeAccount acc) {
        acc.setOutstanding(FeeCalculator.outstanding(acc.getTotalDue(), acc.getTotalPaid(), acc.getConcessionAmount()));
    }

    private String nextInvoiceNumber() {
        String prefix = "INV-" + Year.now() + "-";
        long count = invoiceRepository.countByInvoiceNumberStartingWith(prefix) + 1;
        return prefix + String.format("%04d", count);
    }

    private String nextReceiptNumber() {
        String prefix = "RCP-" + Year.now() + "-";
        long count = receiptRepository.countByReceiptNumberStartingWith(prefix) + 1;
        return prefix + String.format("%04d", count);
    }
}
