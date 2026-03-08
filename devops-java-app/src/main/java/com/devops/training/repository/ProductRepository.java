package com.devops.training.repository;

import com.devops.training.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Product Repository
 * Demonstrates Spring Data JPA repository pattern
 * 
 * Interview Questions:
 * 1. What is JpaRepository and what methods does it provide?
 * 2. How does Spring Data JPA create implementations automatically?
 * 3. What is the difference between CrudRepository and JpaRepository?
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Derived query method
    List<Product> findByNameContainingIgnoreCase(String name);
    
    // Custom JPQL query
    @Query("SELECT p FROM Product p WHERE p.price <= :maxPrice")
    List<Product> findProductsUnderPrice(Double maxPrice);
    
    // Native SQL query
    @Query(value = "SELECT * FROM products WHERE quantity > 0", nativeQuery = true)
    List<Product> findAvailableProducts();
}
