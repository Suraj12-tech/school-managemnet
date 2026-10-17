package com.schoolenterprise;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Stage1ApiAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JavaMailSender mailSender;

    @Test
    void publicLoginRejectsBadCredentialsWithUnauthorizedEvenWhenBearerTokenIsPresent() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("Authorization", "Bearer stale-or-invalid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"invalid-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void publicLoginAuthenticatesAdminEvenWhenBearerTokenIsPresent() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("Authorization", "Bearer stale-or-invalid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"Admin@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.roles").value(org.hamcrest.Matchers.hasItem("ADMIN")));
    }

    @Test
    void publicLoginAcceptsDefaultLocalAdminFrontendOrigin() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"Admin@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roles").value(org.hamcrest.Matchers.hasItem("ADMIN")))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void publicLoginPreflightAcceptsDefaultLocalAdminFrontendOrigin() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .options("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void loginAndDashboardWorkWithSeededAdmin() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"Admin@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roles").isArray())
                .andExpect(jsonPath("$.data.roles").value(org.hamcrest.Matchers.hasItem("ADMIN")))
                .andExpect(jsonPath("$.data.permissions").value(org.hamcrest.Matchers.hasItem("dashboard:view")))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andReturn();

        String body = login.getResponse().getContentAsString();
        String token = body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/dashboard/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/roles").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/timetable/working-days").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days").isArray());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/timetable/working-days")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"days\":[\"FRIDAY\",\"MONDAY\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days[0]").value("FRIDAY"))
                .andExpect(jsonPath("$.data.days[1]").value("MONDAY"));

        mockMvc.perform(get("/api/timetable/working-days").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days[0]").value("FRIDAY"))
                .andExpect(jsonPath("$.data.days[1]").value("MONDAY"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/timetable/working-days")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"days\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days").isEmpty());
    }

    @Test
    void unauthenticatedRequestsCannotReadAdminOrTeacherData() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/teacher/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void teacherCanReadAssignedSharedDataButCannotManageAdminUsers() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"teacher\",\"password\":\"Teacher@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roles").value(org.hamcrest.Matchers.hasItem("CLASS_TEACHER")))
                .andReturn();
        String token = login.getResponse().getContentAsString().replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/teacher/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.staffId", notNullValue()));

        mockMvc.perform(get("/api/teacher/assignments").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].assignmentType").value("CLASS_TEACHER"));

        MvcResult sections = mockMvc.perform(get("/api/teacher/sections")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id", notNullValue()))
                .andReturn();
        Object sectionIdValue = com.jayway.jsonpath.JsonPath.read(
                sections.getResponse().getContentAsString(), "$.data[0].id");
        String sectionId = sectionIdValue.toString();

        mockMvc.perform(get("/api/teacher/sections/{id}/students", sectionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].studentIdentifier", notNullValue()));

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/timetable/working-days").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/timetable/working-days")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"days\":[\"MONDAY\"]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void teacherCannotViewFees() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"teacher\",\"password\":\"Teacher@123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String token = login.getResponse().getContentAsString().replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/fee-heads").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
