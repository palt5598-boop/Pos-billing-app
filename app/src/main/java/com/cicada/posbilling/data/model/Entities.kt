package com.cicada.posbilling.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val barcode: String? = null,
    val sellingPrice: Double,
    val costPrice: Double,
    val stock: Int,
    val lowStockThreshold: Int = 5,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey val id: String,
    val name: String,
    val phone: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "bills")
data class BillEntity(
    @PrimaryKey val id: String,
    val billNumber: String,
    val customerId: String? = null,
    val customerName: String? = null,
    val totalAmount: Double,
    val paymentMode: String,
    val itemsSummary: String,
    val createdAt: Long = System.currentTimeMillis()
)

data class CartItem(
    val product: ProductEntity,
    val qty: Int
) {
    val subtotal: Double get() = product.sellingPrice * qty
}
