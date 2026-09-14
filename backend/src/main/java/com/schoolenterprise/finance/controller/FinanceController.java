package com.schoolenterprise.finance.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.finance.entity.*;
import com.schoolenterprise.finance.service.FinanceService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping("/fee-heads")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<FeeHead>> heads() {
        return ApiResponse.ok(financeService.feeHeads());
    }

    @PostMapping("/fee-heads")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<FeeHead> saveHead(@RequestBody FeeHead head) {
        return ApiResponse.ok(financeService.saveFeeHead(head));
    }

    @GetMapping("/fee-structures")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<FeeStructure>> structures() {
        return ApiResponse.ok(financeService.structures());
    }

    @PostMapping("/fee-structures")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<FeeStructure> saveStructure(@RequestBody FeeStructure structure) {
        return ApiResponse.ok(financeService.saveStructure(structure));
    }

    @GetMapping("/fee-structures/{id}/items")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<FeeStructureItem>> items(@PathVariable Long id) {
        return ApiResponse.ok(financeService.structureItems(id));
    }

    @PostMapping("/fee-structure-items")
    @RequirePermission(module = "fees", action = "edit")
    public ApiResponse<FeeStructureItem> saveItem(@RequestBody FeeStructureItem item) {
        return ApiResponse.ok(financeService.saveItem(item));
    }

    @GetMapping("/fee-accounts")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<StudentFeeAccount>> accounts(@RequestParam(required = false) Long academicYearId) {
        return ApiResponse.ok(financeService.accounts(academicYearId));
    }

    @GetMapping("/fee-accounts/student/{studentId}")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<StudentFeeAccount> account(@PathVariable Long studentId, @RequestParam Long academicYearId) {
        return ApiResponse.ok(financeService.account(studentId, academicYearId));
    }

    @PostMapping("/invoices")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<Invoice> invoice(@RequestBody InvoiceBody body) {
        return ApiResponse.ok(financeService.createInvoiceFromStructure(body.getStudentId(), body.getFeeStructureId(), body.getDueDate()));
    }

    @GetMapping("/invoices")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<Invoice>> invoices(@RequestParam(required = false) Long studentId) {
        return ApiResponse.ok(financeService.invoices(studentId));
    }

    @GetMapping("/invoices/{id}/items")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<InvoiceItem>> invoiceItems(@PathVariable Long id) {
        return ApiResponse.ok(financeService.invoiceItems(id));
    }

    @PostMapping("/payments")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<Receipt> pay(@RequestBody PaymentBody body) {
        return ApiResponse.ok(financeService.recordPayment(body.getInvoiceId(), body.getAmount(), body.getMethod(), body.getReferenceNo()));
    }

    @GetMapping("/invoices/{id}/payments")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<Payment>> payments(@PathVariable Long id) {
        return ApiResponse.ok(financeService.payments(id));
    }

    @GetMapping("/receipts")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<Receipt>> receipts() {
        return ApiResponse.ok(financeService.receipts());
    }

    @PostMapping("/concessions")
    @RequirePermission(module = "fees", action = "approve")
    public ApiResponse<Concession> concession(@RequestBody ConcessionBody body, @AuthenticationPrincipal AppUserDetails user) {
        return ApiResponse.ok(financeService.applyConcession(body.getStudentId(), body.getAcademicYearId(), body.getAmount(), body.getReason(), user.getUserId()));
    }

    @PostMapping("/refunds")
    @RequirePermission(module = "fees", action = "approve")
    public ApiResponse<Refund> refund(@RequestBody RefundBody body) {
        return ApiResponse.ok(financeService.refund(body.getPaymentId(), body.getAmount(), body.getReason()));
    }

    @GetMapping("/reports/fee-dues")
    @RequirePermission(module = "fees", action = "export")
    public ApiResponse<List<StudentFeeAccount>> dues() {
        return ApiResponse.ok(financeService.dues());
    }

    @GetMapping("/reports/collections")
    @RequirePermission(module = "fees", action = "export")
    public ApiResponse<List<Receipt>> collections() {
        return ApiResponse.ok(financeService.receipts());
    }

    @Data
    public static class InvoiceBody {
        private Long studentId;
        private Long feeStructureId;
        private LocalDate dueDate;
    }

    @Data
    public static class PaymentBody {
        private Long invoiceId;
        private BigDecimal amount;
        private String method;
        private String referenceNo;
    }

    @Data
    public static class ConcessionBody {
        private Long studentId;
        private Long academicYearId;
        private BigDecimal amount;
        private String reason;
    }

    @Data
    public static class RefundBody {
        private Long paymentId;
        private BigDecimal amount;
        private String reason;
    }
}
