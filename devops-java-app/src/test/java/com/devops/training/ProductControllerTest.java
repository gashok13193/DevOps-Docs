package com.devops.training;

import com.devops.training.controller.ProductController;
import com.devops.training.model.Product;
import com.devops.training.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit Tests for ProductController
 * Demonstrates testing best practices
 * 
 * Interview Questions:
 * 1. What is @WebMvcTest and when should you use it?
 * 2. What is the difference between @MockBean and @Mock?
 * 3. Explain MockMvc and its purpose
 * 4. What is the testing pyramid?
 */
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
                .id(1L)
                .name("Test Product")
                .description("Test Description")
                .price(99.99)
                .quantity(10)
                .build();
    }

    @Test
    @DisplayName("Should return all products")
    void getAllProducts_ShouldReturnProductList() throws Exception {
        when(productService.getAllProducts())
                .thenReturn(Arrays.asList(testProduct));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Product"))
                .andExpect(jsonPath("$[0].price").value(99.99));
    }

    @Test
    @DisplayName("Should return product by ID")
    void getProductById_ShouldReturnProduct() throws Exception {
        when(productService.getProductById(1L))
                .thenReturn(Optional.of(testProduct));

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Product"));
    }

    @Test
    @DisplayName("Should return 404 when product not found")
    void getProductById_ShouldReturn404_WhenNotFound() throws Exception {
        when(productService.getProductById(999L))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/products/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should create new product")
    void createProduct_ShouldReturnCreatedProduct() throws Exception {
        when(productService.createProduct(any(Product.class)))
                .thenReturn(testProduct);

        String productJson = """
                {
                    "name": "Test Product",
                    "description": "Test Description",
                    "price": 99.99,
                    "quantity": 10
                }
                """;

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Product"));
    }

    @Test
    @DisplayName("Should update existing product")
    void updateProduct_ShouldReturnUpdatedProduct() throws Exception {
        Product updatedProduct = Product.builder()
                .id(1L)
                .name("Updated Product")
                .description("Updated Description")
                .price(149.99)
                .quantity(20)
                .build();

        when(productService.updateProduct(eq(1L), any(Product.class)))
                .thenReturn(updatedProduct);

        String productJson = """
                {
                    "name": "Updated Product",
                    "description": "Updated Description",
                    "price": 149.99,
                    "quantity": 20
                }
                """;

        mockMvc.perform(put("/api/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Product"));
    }

    @Test
    @DisplayName("Should delete product")
    void deleteProduct_ShouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/v1/products/1"))
                .andExpect(status().isNoContent());
    }
}
