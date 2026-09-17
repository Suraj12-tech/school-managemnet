package com.schoolenterprise.common.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    Jackson2ObjectMapperBuilderCustomizer hibernateLazyModule() {
        return builder -> {
            Hibernate6Module module = new Hibernate6Module();
            module.disable(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION);
            module.disable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
            builder.modulesToInstall(module);
        };
    }
}
