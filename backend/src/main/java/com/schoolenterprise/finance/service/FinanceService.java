package com.schoolenterprise.finance.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.finance.entity.*;
import com.schoolenterprise.finance.dto.FeeHeadRequest;
import com.schoolenterprise.finance.dto.FeeStructureItemRequest;
import com.schoolenterprise.finance.dto.FeeStructureRequest;
import com.schoolenterprise.finance.dto.FeeStructureResponse;
import com.schoolenterprise.finance.dto.AccountConcessionRequest;
import com.schoolenterprise.finance.dto.FeeAccountResponse;
import com.schoolenterprise.finance.dto.InvoiceResponse;
import com.schoolenterprise.finance.dto.ReceiptResponse;
import com.schoolenterprise.finance.dto.FinanceReportResponse;
import com.schoolenterprise.finance.repository.*;
import com.schoolenterprise.finance.util.FeeCalculator;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.student.repository.EnrollmentRepository;
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
    private final SchoolClassRepository schoolClassRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SectionRepository sectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SchoolService schoolService;
    private final AuditService auditService;
    private final PermissionService permissionService;

    public List<FeeHead> feeHeads() {
        return feeHeadRepository.findBySchoolId(schoolService.getSchool().getId());
    }

    public FeeHead feeHead(Long id) {
        FeeHead head = feeHeadRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Fee head not found"));
        if (!schoolService.getSchool().getId().equals(head.getSchoolId())) {
            throw AppException.notFound("Fee head not found");
        }
        return head;
    }

    @Transactional
    public FeeHead createFeeHead(FeeHeadRequest request) {
        Long schoolId = schoolService.getSchool().getId();
        String name = request.getName().trim();
        String code = request.getCode().trim().toUpperCase();
        if (feeHeadRepository.existsBySchoolIdAndNameIgnoreCase(schoolId, name)
                || feeHeadRepository.existsBySchoolIdAndCodeIgnoreCase(schoolId, code)) {
            throw AppException.badRequest("Fee head name or code already exists");
        }
        FeeHead head = new FeeHead();
        applyFeeHead(head, request, schoolId);
        FeeHead saved = feeHeadRepository.save(head);
        auditService.record("fees", "create", "FeeHead", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public FeeHead updateFeeHead(Long id, FeeHeadRequest request) {
        FeeHead head = feeHead(id);
        Long schoolId = head.getSchoolId();
        String name = request.getName().trim();
        String code = request.getCode().trim().toUpperCase();
        if (feeHeadRepository.existsBySchoolIdAndNameIgnoreCaseAndIdNot(schoolId, name, id)
                || feeHeadRepository.existsBySchoolIdAndCodeIgnoreCaseAndIdNot(schoolId, code, id)) {
            throw AppException.badRequest("Fee head name or code already exists");
        }
        applyFeeHead(head, request, schoolId);
        FeeHead saved = feeHeadRepository.save(head);
        auditService.record("fees", "edit", "FeeHead", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public FeeHead updateFeeHeadStatus(Long id, String status) {
        FeeHead head = feeHead(id);
        head.setStatus(status);
        FeeHead saved = feeHeadRepository.save(head);
        auditService.record("fees", "edit", "FeeHead", saved.getId(), "Status " + status);
        return saved;
    }

    @Transactional
    public void deleteFeeHead(Long id) {
        FeeHead head = feeHead(id);
        if (feeStructureItemRepository.existsByFeeHeadId(id)
                || invoiceItemRepository.existsByFeeHeadId(id)) {
            throw AppException.badRequest("Fee head is referenced and cannot be deleted");
        }
        feeHeadRepository.delete(head);
        auditService.record("fees", "delete", "FeeHead", id, head.getName());
    }

    private void applyFeeHead(FeeHead head, FeeHeadRequest request, Long schoolId) {
        head.setSchoolId(schoolId);
        head.setName(request.getName().trim());
        head.setCode(request.getCode().trim().toUpperCase());
        head.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        head.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
    }

    public List<FeeStructureResponse> structures() {
        Long schoolId = schoolService.getSchool().getId();
        return feeStructureRepository.findAll().stream()
                .filter(structure -> academicYearRepository.findById(structure.getAcademicYearId())
                        .map(year -> schoolId.equals(year.getSchoolId())).orElse(false))
                .map(this::structureResponse).toList();
    }

    public FeeStructureResponse structure(Long id) {
        return structureResponse(findStructure(id));
    }

    @Transactional
    public FeeStructureResponse createStructure(FeeStructureRequest request) {
        validateStructure(request, null);
        FeeStructure structure = new FeeStructure();
        applyStructure(structure, request);
        FeeStructure saved = feeStructureRepository.save(structure);
        replaceStructureItems(saved.getId(), request.getItems());
        auditService.record("fees", "create", "FeeStructure", saved.getId(), saved.getName());
        return structureResponse(saved);
    }

    @Transactional
    public FeeStructureResponse updateStructure(Long id, FeeStructureRequest request) {
        FeeStructure structure = findStructure(id);
        validateStructure(request, id);
        applyStructure(structure, request);
        FeeStructure saved = feeStructureRepository.save(structure);
        replaceStructureItems(saved.getId(), request.getItems());
        auditService.record("fees", "edit", "FeeStructure", saved.getId(), saved.getName());
        return structureResponse(saved);
    }

    @Transactional
    public FeeStructureResponse updateStructureStatus(Long id, String status) {
        FeeStructure structure = findStructure(id);
        structure.setStatus(status);
        return structureResponse(feeStructureRepository.save(structure));
    }

    @Transactional
    public void deleteStructure(Long id) {
        FeeStructure structure = findStructure(id);
        if (accountRepository.existsByAcademicYearId(structure.getAcademicYearId())
                || invoiceRepository.existsByAcademicYearId(structure.getAcademicYearId())) {
            throw AppException.badRequest("Fee structure is referenced by fee accounts or invoices");
        }
        feeStructureItemRepository.deleteByFeeStructureId(id);
        feeStructureRepository.delete(structure);
    }

    public List<FeeStructureResponse.Item> structureItems(Long structureId) {
        return structureResponse(findStructure(structureId)).getItems();
    }

    @Transactional
    public FeeStructureResponse.Item saveItem(Long structureId, FeeStructureItemRequest request) {
        FeeStructure structure = findStructure(structureId);
        if (!"ACTIVE".equalsIgnoreCase(structure.getStatus())) {
            throw AppException.badRequest("Cannot add items to an inactive fee structure");
        }
        validateFeeHead(request.getFeeHeadId());
        FeeStructureItem item = new FeeStructureItem();
        item.setFeeStructureId(structureId);
        item.setFeeHeadId(request.getFeeHeadId());
        item.setAmount(request.getAmount());
        return itemResponse(feeStructureItemRepository.save(item));
    }

    private FeeStructure findStructure(Long id) {
        FeeStructure structure = feeStructureRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Fee structure not found"));
        Long schoolId = schoolService.getSchool().getId();
        boolean valid = academicYearRepository.findById(structure.getAcademicYearId())
                .map(year -> schoolId.equals(year.getSchoolId())).orElse(false)
                && schoolClassRepository.findById(structure.getClassId())
                .map(schoolClass -> schoolId.equals(schoolClass.getSchoolId())).orElse(false);
        if (!valid) {
            throw AppException.notFound("Fee structure not found");
        }
        return structure;
    }

    private void validateStructure(FeeStructureRequest request, Long id) {
        Long schoolId = schoolService.getSchool().getId();
        academicYearRepository.findById(request.getAcademicYearId())
                .filter(y -> schoolId.equals(y.getSchoolId()) && "ACTIVE".equalsIgnoreCase(y.getStatus()))
                .orElseThrow(() -> AppException.badRequest("Academic year is invalid or inactive"));
        schoolClassRepository.findById(request.getClassId())
                .filter(c -> schoolId.equals(c.getSchoolId()))
                .orElseThrow(() -> AppException.badRequest("Class is invalid"));
        String category = request.getCategory().trim().toUpperCase();
        boolean duplicate = id == null
                ? feeStructureRepository.existsByAcademicYearIdAndClassIdAndCategory(request.getAcademicYearId(), request.getClassId(), category)
                : feeStructureRepository.existsByAcademicYearIdAndClassIdAndCategoryAndIdNot(request.getAcademicYearId(), request.getClassId(), category, id);
        if (duplicate) {
            throw AppException.badRequest("A fee structure already exists for this class, academic year and category");
        }
        java.util.Set<Long> ids = new java.util.HashSet<>();
        for (FeeStructureItemRequest item : request.getItems()) {
            if (!ids.add(item.getFeeHeadId())) {
                throw AppException.badRequest("A fee head cannot be added more than once");
            }
            validateFeeHead(item.getFeeHeadId());
        }
    }

    private void validateFeeHead(Long id) {
        FeeHead head = feeHeadRepository.findById(id)
                .orElseThrow(() -> AppException.badRequest("Fee head not found"));
        if (!schoolService.getSchool().getId().equals(head.getSchoolId())
                || !"ACTIVE".equalsIgnoreCase(head.getStatus())) {
            throw AppException.badRequest("Only active fee heads from this school can be added");
        }
    }

    private void applyStructure(FeeStructure structure, FeeStructureRequest request) {
        structure.setName(request.getName().trim());
        structure.setCategory(request.getCategory().trim().toUpperCase());
        structure.setAcademicYearId(request.getAcademicYearId());
        structure.setClassId(request.getClassId());
        structure.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
    }

    private void replaceStructureItems(Long structureId, List<FeeStructureItemRequest> requests) {
        feeStructureItemRepository.deleteByFeeStructureId(structureId);
        for (FeeStructureItemRequest request : requests) {
            FeeStructureItem item = new FeeStructureItem();
            item.setFeeStructureId(structureId);
            item.setFeeHeadId(request.getFeeHeadId());
            item.setAmount(request.getAmount());
            feeStructureItemRepository.save(item);
        }
    }

    private FeeStructureResponse structureResponse(FeeStructure structure) {
        FeeStructureResponse response = new FeeStructureResponse();
        response.setId(structure.getId());
        response.setName(structure.getName());
        response.setCategory(structure.getCategory());
        response.setAcademicYearId(structure.getAcademicYearId());
        response.setClassId(structure.getClassId());
        response.setStatus(structure.getStatus());
        academicYearRepository.findById(structure.getAcademicYearId()).ifPresent(y -> response.setAcademicYear(y.getName()));
        schoolClassRepository.findById(structure.getClassId()).ifPresent(c -> response.setClassName(c.getName()));
        List<FeeStructureResponse.Item> mapped = feeStructureItemRepository.findByFeeStructureId(structure.getId())
                .stream().map(this::itemResponse).toList();
        response.setItems(mapped);
        response.setTotalAmount(mapped.stream().map(FeeStructureResponse.Item::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return response;
    }

    private FeeStructureResponse.Item itemResponse(FeeStructureItem item) {
        FeeStructureResponse.Item response = new FeeStructureResponse.Item();
        response.setId(item.getId());
        response.setFeeHeadId(item.getFeeHeadId());
        response.setAmount(item.getAmount());
        feeHeadRepository.findById(item.getFeeHeadId()).ifPresent(h -> response.setFeeHead(h.getName()));
        return response;
    }

    public FeeAccountResponse account(Long studentId, Long yearId) {
        return accountResponse(accountRepository.findByStudentIdAndAcademicYearId(studentId, yearId)
                .orElseGet(() -> createAccount(studentId, yearId)));
    }

    public List<FeeAccountResponse> accounts(Long yearId) {
        if (yearId != null) {
            permissionService.assertYearAccess(yearId);
        }
        List<StudentFeeAccount> accounts = yearId == null
                ? accountRepository.findAll()
                : accountRepository.findByAcademicYearId(yearId);
        return accounts.stream().map(this::accountResponse).toList();
    }

    private Long effectiveYearId(Long yearId) {
        if (permissionService.canAccessHistoricalYears()) {
            return yearId;
        }
        Long current = permissionService.currentAcademicYearId();
        return yearId == null ? current : yearId;
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
        invoice.setFeeStructureId(structure.getId());
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

        StudentFeeAccount acc = accountEntity(studentId, structure.getAcademicYearId());
        acc.setTotalDue(acc.getTotalDue().add(total));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "create", "Invoice", invoice.getId(), invoice.getInvoiceNumber());
        return invoice;
    }

    public List<InvoiceResponse> invoices(Long studentId) {
        List<Invoice> invoices = studentId == null
                ? invoiceRepository.findAll()
                : invoiceRepository.findByStudentId(studentId);
        return invoices.stream().map(this::invoiceResponse).toList();
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
                .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = invoice.getTotalAmount() == null ? BigDecimal.ZERO : invoice.getTotalAmount();
        BigDecimal outstanding = total.subtract(alreadyPaid).max(BigDecimal.ZERO);
        if ("PAID".equalsIgnoreCase(invoice.getStatus()) || outstanding.signum() == 0) {
            throw AppException.badRequest("Invoice is already fully paid");
        }
        if (amount.compareTo(outstanding) > 0) {
            throw AppException.badRequest("Payment exceeds invoice outstanding amount of " + outstanding);
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

        StudentFeeAccount acc = accountEntity(invoice.getStudentId(), invoice.getAcademicYearId());
        acc.setTotalPaid(acc.getTotalPaid().add(amount));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "create", "Payment", payment.getId(), receipt.getReceiptNumber());
        return receipt;
    }

    public List<Payment> payments(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public List<ReceiptResponse> receipts() {
        return receiptRepository.findAll().stream().map(this::receiptResponse).toList();
    }

    private InvoiceResponse invoiceResponse(Invoice invoice) {
        InvoiceResponse response = new InvoiceResponse();
        response.setId(invoice.getId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setStudentId(invoice.getStudentId());
        response.setFeeStructureId(invoice.getFeeStructureId());
        response.setTotalAmount(invoice.getTotalAmount());
        response.setIssueDate(invoice.getIssueDate());
        response.setDueDate(invoice.getDueDate());
        BigDecimal paid = paymentRepository.findByInvoiceId(invoice.getId()).stream()
                .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        response.setPaidAmount(paid);
        response.setOutstanding((invoice.getTotalAmount() == null ? BigDecimal.ZERO : invoice.getTotalAmount())
                .subtract(paid).max(BigDecimal.ZERO));
        response.setStatus(FeeCalculator.invoiceStatus(invoice.getTotalAmount(), paid));
        studentRepository.findById(invoice.getStudentId()).ifPresent(student ->
                response.setStudent((student.getFirstName() + " " + student.getLastName()).trim()));
        if (invoice.getFeeStructureId() != null) {
            feeStructureRepository.findById(invoice.getFeeStructureId())
                    .ifPresent(structure -> response.setFeeStructure(structure.getName()));
        }
        return response;
    }

    private ReceiptResponse receiptResponse(Receipt receipt) {
        ReceiptResponse response = new ReceiptResponse();
        response.setId(receipt.getId());
        response.setReceiptNumber(receipt.getReceiptNumber());
        response.setPaymentId(receipt.getPaymentId());
        response.setPaymentDate(receipt.getIssuedOn());
        response.setIssuedOn(receipt.getIssuedOn());
        paymentRepository.findById(receipt.getPaymentId()).ifPresent(payment -> {
            response.setAmount(payment.getAmount());
            response.setPaymentMethod(payment.getMethod());
            invoiceRepository.findById(payment.getInvoiceId()).ifPresent(invoice -> {
                response.setInvoiceNumber(invoice.getInvoiceNumber());
                studentRepository.findById(invoice.getStudentId()).ifPresent(student ->
                        response.setStudent((student.getFirstName() + " " + student.getLastName()).trim()));
            });
        });
        return response;
    }

    @Transactional
    public Concession applyConcession(Long studentId, Long yearId, BigDecimal amount, String reason, Long approvedBy) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Concession amount must be greater than 0");
        }
        studentRepository.findById(studentId).orElseThrow(() -> AppException.notFound("Student not found"));
        academicYearRepository.findById(yearId).orElseThrow(() -> AppException.notFound("Academic year not found"));
        StudentFeeAccount acc = accountRepository.findByStudentIdAndAcademicYearId(studentId, yearId)
                .orElseThrow(() -> AppException.badRequest("No fee account exists for this student and academic year"));
        if (amount.compareTo(acc.getOutstanding()) > 0) {
            throw AppException.badRequest("Concession cannot exceed the outstanding amount");
        }
        Concession concession = new Concession();
        concession.setStudentId(studentId);
        concession.setAcademicYearId(yearId);
        concession.setAmount(amount);
        concession.setReason(reason);
        concession.setApprovedBy(approvedBy);
        concession = concessionRepository.save(concession);

        acc.setConcessionAmount(acc.getConcessionAmount().add(amount));
        refreshOutstanding(acc);
        accountRepository.save(acc);

        auditService.record("fees", "approve", "Concession", concession.getId(), amount.toPlainString());
        return concession;
    }

    @Transactional
    public FeeAccountResponse applyConcession(AccountConcessionRequest request, Long approvedBy) {
        applyConcession(request.getStudentId(), request.getAcademicYearId(), request.getAmount(),
                request.getReason(), approvedBy);
        return account(request.getStudentId(), request.getAcademicYearId());
    }

    private StudentFeeAccount accountEntity(Long studentId, Long yearId) {
        return accountRepository.findByStudentIdAndAcademicYearId(studentId, yearId)
                .orElseGet(() -> createAccount(studentId, yearId));
    }

    private FeeAccountResponse accountResponse(StudentFeeAccount account) {
        FeeAccountResponse response = new FeeAccountResponse();
        response.setId(account.getId());
        response.setStudentId(account.getStudentId());
        response.setAcademicYearId(account.getAcademicYearId());
        response.setTotalDue(n(account.getTotalDue()));
        response.setTotalPaid(n(account.getTotalPaid()));
        response.setConcessionAmount(n(account.getConcessionAmount()));
        response.setOutstanding(n(account.getOutstanding()));
        response.setStatus(accountStatus(response));
        studentRepository.findById(account.getStudentId()).ifPresent(student -> {
            response.setStudent((student.getFirstName() + " " + student.getLastName()).trim());
            enrollmentRepository.findByStudentId(student.getId()).stream()
                    .filter(enrollment -> account.getAcademicYearId().equals(enrollment.getAcademicYearId()))
                    .findFirst().ifPresent(enrollment -> sectionRepository.findById(enrollment.getSectionId()).ifPresent(section -> {
                        response.setSection(section.getName());
                        schoolClassRepository.findById(section.getClassId()).ifPresent(c -> response.setClassName(c.getName()));
                    }));
        });
        academicYearRepository.findById(account.getAcademicYearId()).ifPresent(year -> response.setAcademicYear(year.getName()));
        response.setBreakdown(accountBreakdown(account));
        response.setPayments(accountPayments(account));
        return response;
    }

    private List<FeeAccountResponse.Breakdown> accountBreakdown(StudentFeeAccount account) {
        java.util.Map<Long, FeeAccountResponse.Breakdown> result = new java.util.LinkedHashMap<>();
        invoiceRepository.findByStudentId(account.getStudentId()).stream()
                .filter(invoice -> account.getAcademicYearId().equals(invoice.getAcademicYearId()))
                .forEach(invoice -> {
                    List<InvoiceItem> invoiceItems = invoiceItemRepository.findByInvoiceId(invoice.getId());
                    BigDecimal invoiceTotal = invoiceItems.stream().map(i -> n(i.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal paid = paymentRepository.findByInvoiceId(invoice.getId()).stream()
                            .map(p -> n(p.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
                    for (InvoiceItem item : invoiceItems) {
                        FeeAccountResponse.Breakdown row = result.computeIfAbsent(item.getFeeHeadId(), ignored -> {
                            FeeAccountResponse.Breakdown value = new FeeAccountResponse.Breakdown();
                            feeHeadRepository.findById(item.getFeeHeadId()).ifPresent(head -> value.setFeeHead(head.getName()));
                            return value;
                        });
                        BigDecimal due = n(item.getAmount());
                        BigDecimal itemPaid = invoiceTotal.signum() == 0 ? BigDecimal.ZERO
                                : paid.multiply(due).divide(invoiceTotal, 2, java.math.RoundingMode.HALF_UP);
                        row.setDue(n(row.getDue()).add(due));
                        row.setPaid(n(row.getPaid()).add(itemPaid));
                        row.setOutstanding(FeeCalculator.outstanding(row.getDue(), row.getPaid(), BigDecimal.ZERO));
                    }
                });
        return result.values().stream().toList();
    }

    private List<FeeAccountResponse.PaymentHistory> accountPayments(StudentFeeAccount account) {
        return invoiceRepository.findByStudentId(account.getStudentId()).stream()
                .filter(invoice -> account.getAcademicYearId().equals(invoice.getAcademicYearId()))
                .flatMap(invoice -> paymentRepository.findByInvoiceId(invoice.getId()).stream().map(payment -> {
                    FeeAccountResponse.PaymentHistory row = new FeeAccountResponse.PaymentHistory();
                    row.setDate(payment.getPaidOn());
                    row.setAmount(payment.getAmount());
                    row.setMethod(payment.getMethod());
                    row.setStatus(invoice.getStatus());
                    receiptRepository.findByPaymentId(payment.getId()).ifPresent(receipt -> row.setReceiptNumber(receipt.getReceiptNumber()));
                    return row;
                })).toList();
    }

    private String accountStatus(FeeAccountResponse response) {
        if (response.getTotalDue().signum() > 0 && response.getOutstanding().signum() == 0) return "PAID";
        if (response.getTotalPaid().signum() > 0 || response.getConcessionAmount().signum() > 0) return "PARTIAL";
        return "DUE";
    }

    private BigDecimal n(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
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
        StudentFeeAccount acc = accountEntity(invoice.getStudentId(), invoice.getAcademicYearId());
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

    public FinanceReportResponse reports(Long yearId, Long classId, Long sectionId, String status,
                                         LocalDate from, LocalDate to) {
        if (yearId != null) {
            permissionService.assertYearAccess(yearId);
        }
        List<FeeAccountResponse> dues = accountRepository.findAll().stream()
                .map(this::accountResponse)
                .filter(account -> yearId == null || yearId.equals(account.getAcademicYearId()))
                .filter(account -> accountMatchesClassOrSection(account, classId, sectionId))
                .filter(account -> status == null || status.isBlank() || status.equalsIgnoreCase(account.getStatus()))
                .toList();

        FinanceReportResponse.Summary summary = new FinanceReportResponse.Summary();
        summary.setTotalDue(sum(dues, FeeAccountResponse::getTotalDue));
        summary.setTotalConcession(sum(dues, FeeAccountResponse::getConcessionAmount));
        summary.setOutstanding(sum(dues, FeeAccountResponse::getOutstanding));

        List<ReceiptResponse> collections = receiptRepository.findAll().stream()
                .filter(receipt -> dateInRange(receipt.getIssuedOn(), from, to))
                .map(this::receiptResponse)
                .filter(receipt -> receiptMatches(receipt, yearId, classId, sectionId))
                .toList();
        summary.setTotalCollected(collections.stream().map(receipt -> n(receipt.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        FinanceReportResponse response = new FinanceReportResponse();
        response.setDues(dues);
        response.setSummary(summary);
        response.setCollections(collections);
        return response;
    }

    private boolean accountMatchesClassOrSection(FeeAccountResponse account, Long classId, Long sectionId) {
        if (classId == null && sectionId == null) {
            return true;
        }
        boolean enrolledMatch = enrollmentRepository.findByStudentId(account.getStudentId()).stream()
                .filter(enrollment -> account.getAcademicYearId().equals(enrollment.getAcademicYearId()))
                .anyMatch(enrollment -> {
                    if (sectionId != null && !sectionId.equals(enrollment.getSectionId())) {
                        return false;
                    }
                    return classId == null || sectionRepository.findById(enrollment.getSectionId())
                            .map(section -> classId.equals(section.getClassId())).orElse(false);
                });
        if (enrolledMatch) {
            return true;
        }
        return studentRepository.findById(account.getStudentId())
                .flatMap(student -> java.util.Optional.ofNullable(student.getCurrentSectionId())
                        .flatMap(sectionRepository::findById))
                .filter(section -> account.getAcademicYearId().equals(section.getAcademicYearId()))
                .map(section -> (sectionId == null || sectionId.equals(section.getId()))
                        && (classId == null || classId.equals(section.getClassId())))
                .orElse(false);
    }

    private boolean receiptMatches(ReceiptResponse receipt, Long yearId, Long classId, Long sectionId) {
        if (yearId == null && classId == null && sectionId == null) {
            return true;
        }
        return receipt.getPaymentId() != null && paymentRepository.findById(receipt.getPaymentId())
                .flatMap(payment -> invoiceRepository.findById(payment.getInvoiceId()))
                .map(invoice -> {
                    if (yearId != null && !yearId.equals(invoice.getAcademicYearId())) return false;
                    return accountRepository.findByStudentIdAndAcademicYearId(invoice.getStudentId(), invoice.getAcademicYearId())
                            .map(account -> accountMatchesClassOrSection(accountResponse(account), classId, sectionId))
                            .orElse(false);
                }).orElse(false);
    }

    private boolean dateInRange(LocalDate value, LocalDate from, LocalDate to) {
        return value != null && (from == null || !value.isBefore(from)) && (to == null || !value.isAfter(to));
    }

    private BigDecimal sum(List<FeeAccountResponse> accounts,
                           java.util.function.Function<FeeAccountResponse, BigDecimal> extractor) {
        return accounts.stream().map(extractor).map(this::n).reduce(BigDecimal.ZERO, BigDecimal::add);
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
