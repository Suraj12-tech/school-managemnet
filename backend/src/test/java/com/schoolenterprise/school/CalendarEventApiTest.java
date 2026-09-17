package com.schoolenterprise.school;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CalendarEventApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unauthenticatedAccessIsRejected() throws Exception {
        mockMvc.perform(get("/api/calendar-events"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void calendarEventLifecycleAndValidationWorks() throws Exception {
        String token = login("admin", "Admin@123");

        // 1. Get existing academic years to find active year ID and dates
        MvcResult yearsResult = mockMvc.perform(get("/api/academic-years")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        String yearsBody = yearsResult.getResponse().getContentAsString();

        // Ensure we have an active year id
        long yearId = 1L; // seeded year

        // 2. Create single-day event (endDate omitted)
        MvcResult singleDayCreate = mockMvc.perform(post("/api/calendar-events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "academicYearId": %d,
                                  "title": "Independence Day Celebration",
                                  "eventType": "HOLIDAY",
                                  "startDate": "2026-08-15",
                                  "description": "National Holiday"
                                }
                                """.formatted(yearId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.title").value("Independence Day Celebration"))
                .andExpect(jsonPath("$.data.eventType").value("HOLIDAY"))
                .andExpect(jsonPath("$.data.startDate").value("2026-08-15"))
                .andExpect(jsonPath("$.data.endDate").value("2026-08-15"))
                .andReturn();
        long eventId = idFrom(singleDayCreate);

        // 3. Create multi-day event
        MvcResult multiDayCreate = mockMvc.perform(post("/api/calendar-events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "academicYearId": %d,
                                  "title": "Mid-Term Examinations",
                                  "eventType": "EXAM",
                                  "startDate": "2026-10-10",
                                  "endDate": "2026-10-20",
                                  "description": "All grades examination schedule"
                                }
                                """.formatted(yearId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.eventType").value("EXAM"))
                .andReturn();
        long examEventId = idFrom(multiDayCreate);

        // 4. Fetch events by year
        mockMvc.perform(get("/api/calendar-events?academicYearId=" + yearId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", hasItem("Independence Day Celebration")))
                .andExpect(jsonPath("$.data[*].title", hasItem("Mid-Term Examinations")));

        // 5. Filter events by eventType
        mockMvc.perform(get("/api/calendar-events?academicYearId=" + yearId + "&eventType=EXAM")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", hasItem("Mid-Term Examinations")))
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Independence Day Celebration"))));

        // 6. Get single event
        mockMvc.perform(get("/api/calendar-events/" + eventId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(eventId))
                .andExpect(jsonPath("$.data.title").value("Independence Day Celebration"));

        // 7. Update event
        mockMvc.perform(put("/api/calendar-events/" + eventId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "academicYearId": %d,
                                  "title": "Independence Day Flag Hoisting",
                                  "eventType": "SCHOOL_EVENT",
                                  "startDate": "2026-08-15",
                                  "endDate": "2026-08-15",
                                  "description": "Special assembly and cultural program"
                                }
                                """.formatted(yearId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Independence Day Flag Hoisting"))
                .andExpect(jsonPath("$.data.eventType").value("SCHOOL_EVENT"));

        // 8. Update event status
        mockMvc.perform(patch("/api/calendar-events/" + eventId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        // 9. Validation: start date after end date
        mockMvc.perform(post("/api/calendar-events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "academicYearId": %d,
                                  "title": "Invalid Date Event",
                                  "eventType": "ACTIVITY",
                                  "startDate": "2026-10-20",
                                  "endDate": "2026-10-10"
                                }
                                """.formatted(yearId)))
                .andExpect(status().isBadRequest());

        // 10. Validation: dates outside academic year
        mockMvc.perform(post("/api/calendar-events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "academicYearId": %d,
                                  "title": "Out of Range Event",
                                  "eventType": "ACTIVITY",
                                  "startDate": "2020-01-01",
                                  "endDate": "2020-01-02"
                                }
                                """.formatted(yearId)))
                .andExpect(status().isBadRequest());

        // 11. Delete events
        mockMvc.perform(delete("/api/calendar-events/" + eventId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/calendar-events/" + examEventId + "/delete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Verify deleted
        mockMvc.perform(get("/api/calendar-events/" + eventId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private String login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"%s"}
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getContentAsString()
                .replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    private long idFrom(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        return Long.parseLong(body.replaceAll(".*\"id\":([0-9]+).*", "$1"));
    }
}
