package com.schoolenterprise.finance.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.RequirePermission;
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
import com.schoolenterprise.finance.service.FinanceService;
import com.schoolenterprise.school.dto.StatusRequest;
import jakarta.validation.Valid;
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

    @GetMapping("/fee-heads/{id}")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<FeeHead> head(@PathVariable Long id) {
        return ApiResponse.ok(financeService.feeHead(id));
    }

    @PostMapping("/fee-heads")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<FeeHead> saveHead(@Valid @RequestBody FeeHeadRequest request) {
        return ApiResponse.ok(financeService.createFeeHead(request));
    }

    @PutMapping("/fee-heads/{id}")
    @RequirePermission(module = "fees", action = "edit")
    public ApiResponse<FeeHead> updateHead(@PathVariable Long id, @Valid @RequestBody FeeHeadRequest request) {
        return ApiResponse.ok(financeService.updateFeeHead(id, request));
    }

    @PatchMapping("/fee-heads/{id}/status")
    @RequirePermission(module = "fees", action = "edit")
    public ApiResponse<FeeHead> updateHeadStatus(@PathVariable Long id,
                                                  @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(financeService.updateFeeHeadStatus(id, request.getStatus()));
    }

    @DeleteMapping("/fee-heads/{id}")
    @RequirePermission(module = "fees", action = "delete")
    public ApiResponse<Void> deleteHead(@PathVariable Long id) {
        financeService.deleteFeeHead(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/fee-structures")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<FeeStructureResponse>> structures() {
        return ApiResponse.ok(financeService.structures());
    }

    @GetMapping("/fee-structures/{id}")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<FeeStructureResponse> structure(@PathVariable Long id) {
        return ApiResponse.ok(financeService.structure(id));
    }

    @PostMapping("/fee-structures")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<FeeStructureResponse> saveStructure(@Valid @RequestBody FeeStructureRequest request) {
        return ApiResponse.ok(financeService.createStructure(request));
    }

    @PutMapping("/fee-structures/{id}")
    @RequirePermission(module = "fees", action = "edit")
    public ApiResponse<FeeStructureResponse> updateStructure(@PathVariable Long id,
                                                              @Valid @RequestBody FeeStructureRequest request) {
        return ApiResponse.ok(financeService.updateStructure(id, request));
    }

    @PatchMapping("/fee-structures/{id}/status")
    @RequirePermission(module = "fees", action = "edit")
    public ApiResponse<FeeStructureResponse> updateStructureStatus(@PathVariable Long id,
                                                                    @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(financeService.updateStructureStatus(id, request.getStatus()));
    }

    @DeleteMapping("/fee-structures/{id}")
    @RequirePermission(module = "fees", action = "delete")
    public ApiResponse<Void> deleteStructure(@PathVariable Long id) {
        financeService.deleteStructure(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/fee-structures/{id}/items")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<FeeStructureResponse.Item>> items(@PathVariable Long id) {
        return ApiResponse.ok(financeService.structureItems(id));
    }

    @PostMapping("/fee-structures/{id}/items")
    @RequirePermission(module = "fees", action = "edit")
    public ApiResponse<FeeStructureResponse.Item> saveItem(@PathVariable Long id,
                                                            @Valid @RequestBody FeeStructureItemRequest request) {
        return ApiResponse.ok(financeService.saveItem(id, request));
    }

    @GetMapping("/fee-accounts")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<FeeAccountResponse>> accounts(@RequestParam(required = false) Long academicYearId) {
        return ApiResponse.ok(financeService.accounts(academicYearId));
    }

    @GetMapping("/fee-accounts/student/{studentId}")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<FeeAccountResponse> account(@PathVariable Long studentId, @RequestParam Long academicYearId) {
        return ApiResponse.ok(financeService.account(studentId, academicYearId));
    }

    @PostMapping("/invoices")
    @RequirePermission(module = "fees", action = "create")
    public ApiResponse<Invoice> invoice(@RequestBody InvoiceBody body) {
        return ApiResponse.ok(financeService.createInvoiceFromStructure(body.getStudentId(), body.getFeeStructureId(), body.getDueDate()));
    }

    @GetMapping("/invoices")
    @RequirePermission(module = "fees", action = "view")
    public ApiResponse<List<InvoiceResponse>> invoices(@RequestParam(required = false) Long studentId) {
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
    public ApiResponse<List<ReceiptResponse>> receipts() {
        return ApiResponse.ok(financeService.receipts());
    }

    @PostMapping("/concessions")
    @RequirePermission(module = "fees", action = "approve")
    public ApiResponse<FeeAccountResponse> concession(@Valid @RequestBody AccountConcessionRequest request,
                                                       @AuthenticationPrincipal AppUserDetails user) {
        return ApiResponse.ok(financeService.applyConcession(request, user.getUserId()));
    }

    @PostMapping("/refunds")
    @RequirePermission(module = "fees", action = "approve")
    public ApiResponse<Refund> refund(@RequestBody RefundBody body) {
        return ApiResponse.ok(financeService.refund(body.getPaymentId(), body.getAmount(), body.getReason()));
    }

    @GetMapping("/reports/fee-dues")
    @RequirePermission(module = "fees", action = "export")
    public ApiResponse<FinanceReportResponse> dues(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return ApiResponse.ok(financeService.reports(academicYearId, classId, sectionId, status, from, to));
    }

    @GetMapping("/reports/collections")
    @RequirePermission(module = "fees", action = "export")
    public ApiResponse<List<ReceiptResponse>> collections() {
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
