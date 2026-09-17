package com.cicada.posbilling

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.cicada.posbilling.ui.screens.*
import com.cicada.posbilling.ui.theme.PosBillingTheme
import com.cicada.posbilling.ui.viewmodel.PosViewModel

enum class PosTab(val title: String, val icon: ImageVector) {
    BILLING("New Bill", Icons.Default.PointOfSale),
    PRODUCTS("Items", Icons.Default.Inventory2),
    BILLS("Bills", Icons.Default.ReceiptLong),
    CUSTOMERS("Customers", Icons.Default.People),
    REPORTS("Reports", Icons.Default.BarChart),
    SETTINGS("Settings", Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {
    private val viewModel: PosViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val settings by viewModel.settings.collectAsState()

            PosBillingTheme(darkTheme = settings.darkTheme) {
                var currentTab by remember { mutableStateOf(PosTab.BILLING) }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        TopAppBar(
                            title = {
                                Text(
                                    when (currentTab) {
                                        PosTab.BILLING -> settings.shopName
                                        PosTab.PRODUCTS -> "Product Inventory"
                                        PosTab.BILLS -> "Bills History"
                                        PosTab.CUSTOMERS -> "Customer Directory"
                                        PosTab.REPORTS -> "Reports & Analytics"
                                        PosTab.SETTINGS -> "Settings"
                                    }
                                )
                            },
                            actions = {
                                if (currentTab != PosTab.SETTINGS) {
                                    IconButton(onClick = { currentTab = PosTab.SETTINGS }) {
                                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                                    }
                                }
                            }
                        )
                    },
                    bottomBar = {
                        NavigationBar {
                            listOf(
                                PosTab.BILLING,
                                PosTab.PRODUCTS,
                                PosTab.BILLS,
                                PosTab.CUSTOMERS,
                                PosTab.REPORTS
                            ).forEach { tab ->
                                NavigationBarItem(
                                    selected = currentTab == tab,
                                    onClick = { currentTab = tab },
                                    icon = { Icon(tab.icon, contentDescription = tab.title) },
                                    label = { Text(tab.title) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Surface(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentTab) {
                            PosTab.BILLING -> BillingScreen(
                                viewModel = viewModel,
                                onNavigateToProducts = { currentTab = PosTab.PRODUCTS }
                            )
                            PosTab.PRODUCTS -> ProductsScreen(viewModel = viewModel)
                            PosTab.BILLS -> BillsScreen(viewModel = viewModel)
                            PosTab.CUSTOMERS -> CustomersScreen(viewModel = viewModel)
                            PosTab.REPORTS -> ReportsScreen(viewModel = viewModel)
                            PosTab.SETTINGS -> SettingsScreen(viewModel = viewModel)
                        }
                    }
                }
            }
        }
    }
}
