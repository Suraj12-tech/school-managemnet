package com.schoolenterprise.student;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GuardianManagementApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unauthenticatedGuardianAccessIsRejected() throws Exception {
        mockMvc.perform(get("/api/guardians"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void guardianCrudAndStudentRelationshipLifecycleWorks() throws Exception {
        String token = login("admin", "Admin@123");

        MvcResult guardianCreate = mockMvc.perform(post("/api/guardians")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName":"Grace Guardian",
                                  "relationType":"MOTHER",
                                  "phone":"+919876543210",
                                  "email":"grace.guardian@example.com",
                                  "address":"1 School Road",
                                  "occupation":"Teacher",
                                  "emergencyContact":true,
                                  "status":"ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andReturn();
        long guardianId = idFrom(guardianCreate);

        mockMvc.perform(get("/api/guardians").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].fullName", hasItem("Grace Guardian")));

        mockMvc.perform(put("/api/guardians/" + guardianId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName":"Grace Updated",
                                  "relationType":"MOTHER",
                                  "phone":"+919876543210",
                                  "email":"grace.updated@example.com",
                                  "address":"2 School Road",
                                  "occupation":"Principal",
                                  "emergencyContact":true,
                                  "status":"ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Grace Updated"));

        MvcResult studentCreate = mockMvc.perform(post("/api/students")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "admissionNumber":"ADM-GUARDIAN-001",
                                  "firstName":"Student",
                                  "lastName":"One",
                                  "status":"ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andReturn();
        long studentId = idFrom(studentCreate);

        String linkBody = """
                {
                  "guardianId":%d,
                  "relationshipType":"MOTHER",
                  "primaryGuardian":true,
                  "emergencyContact":true
                }
                """.formatted(guardianId);

        mockMvc.perform(post("/api/students/" + studentId + "/guardians")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.relationshipType").value("MOTHER"));

        mockMvc.perform(post("/api/students/" + studentId + "/guardians")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkBody))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/students/" + studentId + "/guardians")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkBody.replace(String.valueOf(guardianId), "999999")))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/students/999999/guardians")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkBody))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/guardians/" + guardianId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.students[0].studentId").value(studentId))
                .andExpect(jsonPath("$.data.students[0].emergencyContact").value(true));

        mockMvc.perform(get("/api/guardians/999999/students")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/students/" + studentId + "/guardians/" + guardianId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/guardians/" + guardianId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
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
