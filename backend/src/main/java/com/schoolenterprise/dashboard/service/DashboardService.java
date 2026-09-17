package com.schoolenterprise.dashboard.service;

import com.schoolenterprise.finance.entity.Invoice;
import com.schoolenterprise.finance.entity.StudentFeeAccount;
import com.schoolenterprise.finance.repository.InvoiceRepository;
import com.schoolenterprise.finance.repository.StudentFeeAccountRepository;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final StudentFeeAccountRepository accountRepository;
    private final InvoiceRepository invoiceRepository;
    private final AcademicYearRepository academicYearRepository;

    public Map<String, Object> summary() {
        List<StudentFeeAccount> accounts = accountRepository.findAll();
        BigDecimal due = accounts.stream().map(StudentFeeAccount::getTotalDue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = accounts.stream().map(StudentFeeAccount::getTotalPaid).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = accounts.stream().map(StudentFeeAccount::getOutstanding).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<String> alerts = new ArrayList<>();
        if (academicYearRepository.findAll().stream().noneMatch(y -> y.isCurrentYear())) {
            alerts.add("No current academic year is selected");
        }
        long overdue = invoiceRepository.findByStatusAndDueDateBefore("UNPAID", LocalDate.now()).size()
                + invoiceRepository.findByStatusAndDueDateBefore("PARTIAL", LocalDate.now()).size();
        if (overdue > 0) {
            alerts.add(overdue + " invoice(s) are overdue");
        }
        if (studentRepository.countByStatus("ACTIVE") == 0) {
            alerts.add("No active students yet");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("studentCount", studentRepository.count());
        data.put("activeStudents", studentRepository.countByStatus("ACTIVE"));
        data.put("staffCount", staffRepository.count());
        data.put("totalDue", due);
        data.put("totalCollected", paid);
        data.put("outstanding", outstanding);
        data.put("unpaidInvoices", invoiceRepository.findByStatus("UNPAID").size());
        data.put("alerts", alerts);
        return data;
    }

    public List<Invoice> pendingInvoices() {
        List<Invoice> list = new ArrayList<>();
        list.addAll(invoiceRepository.findByStatus("UNPAID"));
        list.addAll(invoiceRepository.findByStatus("PARTIAL"));
        return list;
    }
}
