package com.cicada.posbilling.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cicada.posbilling.data.model.BillEntity
import com.cicada.posbilling.data.model.ProductEntity
import com.cicada.posbilling.ui.theme.Emerald600
import com.cicada.posbilling.ui.viewmodel.PosViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillingScreen(
    viewModel: PosViewModel,
    onNavigateToProducts: () -> Unit
) {
    val products by viewModel.products.collectAsState()
    val customers by viewModel.customers.collectAsState()
    val cart by viewModel.cart.collectAsState()
    val settings by viewModel.settings.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var isScannerOpen by remember { mutableStateOf(false) }
    var selectedCustomerId by remember { mutableStateOf<String?>(null) }
    var selectedPaymentMode by remember { mutableStateOf("Cash") }

    // Dialogs
    var unknownBarcode by remember { mutableStateOf<String?>(null) }
    var showQuickCustomerDialog by remember { mutableStateOf(false) }
    var completedBill by remember { mutableStateOf<BillEntity?>(null) }

    val filteredProducts = remember(searchQuery, products) {
        if (searchQuery.isBlank()) emptyList()
        else products.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    (it.barcode?.contains(searchQuery, ignoreCase = true) == true)
        }
    }

    val cartTotal = remember(cart) { cart.sumOf { it.subtotal } }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search items or barcode...", fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", modifier = Modifier.size(18.dp)) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                                }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    Button(
                        onClick = { isScannerOpen = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)
                    ) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan", modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Scan", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }

                // Live search dropdown
                if (searchQuery.isNotBlank()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                    ) {
                        if (filteredProducts.isNotEmpty()) {
                            LazyColumn(modifier = Modifier.heightIn(max = 220.dp)) {
                                items(filteredProducts) { item ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                viewModel.addToCart(item, 1)
                                                searchQuery = ""
                                            }
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(item.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                            Text("Stock: ${item.stock}", fontSize = 11.sp, color = Color.Gray)
                                        }
                                        Text(
                                            "${settings.currencySymbol}${item.sellingPrice}",
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            color = Emerald600
                                        )
                                        IconButton(onClick = {
                                            viewModel.addToCart(item, 1)
                                            searchQuery = ""
                                        }) {
                                            Icon(Icons.Default.AddCircle, contentDescription = "Add", tint = Emerald600)
                                        }
                                    }
                                    HorizontalDivider()
                                }
                            }
                        } else {
                            Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                Text("No matching products found", fontSize = 12.sp, color = Color.Gray)
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            // Cart Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Emerald600, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Current Bill", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(" (${cart.sumOf { it.qty }} items)", fontSize = 12.sp, color = Color.Gray)
                        }
                        if (cart.isNotEmpty()) {
                            TextButton(onClick = { viewModel.clearCart() }) {
                                Text("Clear", color = Color.Red, fontSize = 12.sp)
                            }
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                    if (cart.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.ShoppingBag, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.LightGray)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Cart is empty", fontWeight = FontWeight.SemiBold, color = Color.Gray)
                                Text("Scan a barcode or search items to begin", fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                    } else {
                        LazyColumn(modifier = Modifier.weight(1f)) {
                            items(cart) { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(item.product.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                        Text("${settings.currencySymbol}${item.product.sellingPrice} each", fontSize = 11.sp, color = Color.Gray)
                                    }

                                    // Stepper
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.background(Color(0xFFEEEEEE), shape = RoundedCornerShape(8.dp))
                                    ) {
                                        IconButton(
                                            onClick = { viewModel.updateCartQty(item.product.id, item.qty - 1) },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(Icons.Default.Remove, contentDescription = "Decrease", modifier = Modifier.size(16.dp))
                                        }
                                        Text("${item.qty}", fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 6.dp))
                                        IconButton(
                                            onClick = { viewModel.updateCartQty(item.product.id, item.qty + 1) },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = "Increase", modifier = Modifier.size(16.dp))
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        "${settings.currencySymbol}${item.subtotal}",
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 13.sp
                                    )
                                }
                                HorizontalDivider(color = Color(0xFFF0F0F0))
                            }
                        }

                        // Bottom Checkout Section
                        Column(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
                            // Customer Selection
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val selectedName = customers.find { it.id == selectedCustomerId }?.name ?: "Walk-in Customer"
                                Text("Customer: $selectedName", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                TextButton(onClick = { showQuickCustomerDialog = true }) {
                                    Text("+ New", fontSize = 12.sp, color = Emerald600)
                                }
                            }

                            // Payment mode chips
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                listOf("Cash", "UPI", "Card").forEach { mode ->
                                    FilterChip(
                                        selected = selectedPaymentMode == mode,
                                        onClick = { selectedPaymentMode = mode },
                                        label = { Text(mode, fontSize = 12.sp) }
                                    )
                                }
                            }

                            // Checkout Button
                            Button(
                                onClick = {
                                    val cust = customers.find { it.id == selectedCustomerId }
                                    viewModel.checkout(
                                        customerId = selectedCustomerId,
                                        customerName = cust?.name,
                                        paymentMode = selectedPaymentMode,
                                        onComplete = { completedBill = it }
                                    )
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                            ) {
                                Text(
                                    "COMPLETE BILL • ${settings.currencySymbol}$cartTotal",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Camera Barcode Scanner (Continuous Scanning Mode)
    if (isScannerOpen) {
        BarcodeScannerDialog(
            onBarcodeScanned = { code ->
                viewModel.onBarcodeScanned(
                    code = code,
                    onFound = {},
                    onNotFound = { unknownBarcode = it }
                )
            },
            onDismiss = { isScannerOpen = false },
            cartItemCount = cart.sumOf { it.qty },
            cartTotal = cartTotal,
            currencySymbol = settings.currencySymbol,
            isPaused = unknownBarcode != null
        )
    }

    // Unknown Barcode Detected - Quick Add Product Dialog
    unknownBarcode?.let { code ->
        var name by remember { mutableStateOf("") }
        var sellPrice by remember { mutableStateOf("") }
        var costPrice by remember { mutableStateOf("") }
        var stock by remember { mutableStateOf("20") }

        AlertDialog(
            onDismissRequest = { unknownBarcode = null },
            title = { Text("New Barcode Scanned") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Barcode #$code is not in inventory. Add it below:", fontSize = 12.sp)
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Product Name *") }, singleLine = true)
                    OutlinedTextField(value = sellPrice, onValueChange = { sellPrice = it }, label = { Text("Selling Price *") }, singleLine = true)
                    OutlinedTextField(value = costPrice, onValueChange = { costPrice = it }, label = { Text("Cost Price") }, singleLine = true)
                    OutlinedTextField(value = stock, onValueChange = { stock = it }, label = { Text("Initial Stock") }, singleLine = true)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val sPrice = sellPrice.toDoubleOrNull() ?: 0.0
                        val cPrice = costPrice.toDoubleOrNull() ?: (sPrice * 0.8)
                        val qty = stock.toIntOrNull() ?: 10
                        if (name.isNotBlank() && sPrice > 0) {
                            val newProduct = ProductEntity(
                                id = java.util.UUID.randomUUID().toString(),
                                name = name,
                                barcode = code,
                                sellingPrice = sPrice,
                                costPrice = cPrice,
                                stock = qty
                            )
                            viewModel.addProduct(name, code, sPrice, cPrice, qty)
                            viewModel.addToCart(newProduct, 1)
                            unknownBarcode = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                ) {
                    Text("Save & Add")
                }
            },
            dismissButton = {
                TextButton(onClick = { unknownBarcode = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Quick Add Customer Dialog
    if (showQuickCustomerDialog) {
        var name by remember { mutableStateOf("") }
        var phone by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showQuickCustomerDialog = false },
            title = { Text("Add Customer") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name *") }, singleLine = true)
                    OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") }, singleLine = true)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            viewModel.addCustomer(name, phone)
                            showQuickCustomerDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showQuickCustomerDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Bill Completed Receipt Dialog
    completedBill?.let { bill ->
        val dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date(bill.createdAt))
        AlertDialog(
            onDismissRequest = { completedBill = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald600)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Bill Completed", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFFAFAFA), shape = RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(settings.shopName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(settings.shopPhone, fontSize = 11.sp, color = Color.Gray)
                    HorizontalDivider(modifier = Modifier.padding(vertical = 6.dp))
                    Text("Bill: ${bill.billNumber}", fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    Text("Customer: ${bill.customerName}", fontSize = 12.sp)
                    Text("Date: $dateStr", fontSize = 11.sp, color = Color.Gray)
                    HorizontalDivider(modifier = Modifier.padding(vertical = 6.dp))
                    Text("Items: ${bill.itemsSummary}", fontSize = 12.sp)
                    HorizontalDivider(modifier = Modifier.padding(vertical = 6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Payment:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(bill.paymentMode, fontSize = 13.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Amount:", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("${settings.currencySymbol}${bill.totalAmount}", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 15.sp, color = Emerald600)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { completedBill = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                ) {
                    Text("Done")
                }
            }
        )
    }
}
