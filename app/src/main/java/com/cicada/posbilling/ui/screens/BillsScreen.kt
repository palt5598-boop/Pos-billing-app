package com.cicada.posbilling.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Search
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
import com.cicada.posbilling.ui.theme.Emerald600
import com.cicada.posbilling.ui.viewmodel.PosViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun BillsScreen(viewModel: PosViewModel) {
    val bills by viewModel.bills.collectAsState()
    val settings by viewModel.settings.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedBill by remember { mutableStateOf<BillEntity?>(null) }

    val filteredBills = remember(bills, searchQuery) {
        if (searchQuery.isBlank()) bills
        else bills.filter {
            it.billNumber.contains(searchQuery, ignoreCase = true) ||
                    it.customerName?.contains(searchQuery, ignoreCase = true) == true
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by bill # or customer...", fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            "${filteredBills.size} Invoices",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Gray,
            modifier = Modifier.padding(vertical = 4.dp)
        )

        if (filteredBills.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.LightGray)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("No bills found", fontWeight = FontWeight.SemiBold, color = Color.Gray)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredBills) { bill ->
                    val dateStr = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()).format(Date(bill.createdAt))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        onClick = { selectedBill = bill }
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(bill.billNumber, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                                Text(
                                    "${settings.currencySymbol}${bill.totalAmount}",
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 15.sp,
                                    color = Emerald600
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(bill.customerName ?: "Walk-in Customer", fontSize = 12.sp, color = Color.Gray)
                                Text(bill.paymentMode, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(dateStr, fontSize = 11.sp, color = Color.LightGray)
                        }
                    }
                }
            }
        }
    }

    selectedBill?.let { bill ->
        val dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date(bill.createdAt))
        AlertDialog(
            onDismissRequest = { selectedBill = null },
            title = { Text("Invoice ${bill.billNumber}", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Customer: ${bill.customerName}")
                    Text("Date: $dateStr", fontSize = 12.sp, color = Color.Gray)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Text("Items: ${bill.itemsSummary}", fontSize = 12.sp)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Text("Payment Mode: ${bill.paymentMode}")
                    Text("Total: ${settings.currencySymbol}${bill.totalAmount}", fontWeight = FontWeight.Bold, color = Emerald600)
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedBill = null }) {
                    Text("Close")
                }
            }
        )
    }
}
