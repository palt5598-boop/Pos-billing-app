package com.cicada.posbilling.ui.screens

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.cicada.posbilling.ui.theme.Emerald500
import com.cicada.posbilling.ui.theme.Emerald600
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

@Composable
fun BarcodeScannerDialog(
    onBarcodeScanned: (String) -> Unit,
    onDismiss: () -> Unit,
    cartItemCount: Int = 0,
    cartTotal: Double = 0.0,
    currencySymbol: String = "₹",
    isPaused: Boolean = false
) {
    val context = LocalContext.current
    val lifecycleOwner = context as LifecycleOwner
    val haptic = LocalHapticFeedback.current
    val coroutineScope = rememberCoroutineScope()

    val currentOnBarcodeScanned by rememberUpdatedState(onBarcodeScanned)
    val currentIsPaused by rememberUpdatedState(isPaused)

    val lastScannedCodeRef = remember { AtomicReference("") }
    val lastScannedTimeRef = remember { AtomicLong(0L) }

    var showSuccessFeedback by remember { mutableStateOf(false) }
    var lastScannedDisplay by remember { mutableStateOf("") }
    var feedbackJob by remember { mutableStateOf<Job?>(null) }

    DisposableEffect(Unit) {
        onDispose {
            try {
                ProcessCameraProvider.getInstance(context).get().unbindAll()
            } catch (e: Exception) {
                Log.e("BarcodeScanner", "Failed to unbind camera", e)
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    text = if (cartItemCount > 0) "Done ($cartItemCount items)" else "Done Scanning",
                    fontWeight = FontWeight.Bold
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        },
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Continuous Scanner", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Point at items to scan continuously", fontSize = 11.sp, color = Color.Gray)
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close")
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp)
                        .background(Color.Black, shape = RoundedCornerShape(14.dp))
                        .border(
                            width = if (showSuccessFeedback) 3.dp else 1.dp,
                            color = if (showSuccessFeedback) Emerald500 else Color.DarkGray,
                            shape = RoundedCornerShape(14.dp)
                        )
                ) {
                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { ctx ->
                            val previewView = PreviewView(ctx)
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                            val executor = ContextCompat.getMainExecutor(ctx)
                            val scanner = BarcodeScanning.getClient()

                            cameraProviderFuture.addListener({
                                val cameraProvider = cameraProviderFuture.get()
                                val preview = Preview.Builder().build().also {
                                    it.setSurfaceProvider(previewView.surfaceProvider)
                                }

                                val imageAnalysis = ImageAnalysis.Builder()
                                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                    .build()

                                imageAnalysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
                                    if (currentIsPaused) {
                                        imageProxy.close()
                                        return@setAnalyzer
                                    }

                                    processImageProxy(scanner, imageProxy) { barcode ->
                                        val now = System.currentTimeMillis()
                                        val lastCode = lastScannedCodeRef.get()
                                        val lastTime = lastScannedTimeRef.get()
                                        val timeElapsed = now - lastTime

                                        val isSameCode = barcode == lastCode
                                        // 1.8s cooldown before scanning the identical barcode again
                                        if (isSameCode && timeElapsed < 1800L) {
                                            return@processImageProxy
                                        }
                                        // Minimum debounce interval (600ms) between scans to prevent jitter
                                        if (timeElapsed < 600L) {
                                            return@processImageProxy
                                        }

                                        lastScannedCodeRef.set(barcode)
                                        lastScannedTimeRef.set(now)

                                        executor.execute {
                                            // Haptic feedback
                                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                            triggerVibration(context)

                                            // Visual feedback
                                            lastScannedDisplay = barcode
                                            showSuccessFeedback = true
                                            feedbackJob?.cancel()
                                            feedbackJob = coroutineScope.launch {
                                                delay(650)
                                                showSuccessFeedback = false
                                            }

                                            // Add item to cart continuously
                                            currentOnBarcodeScanned(barcode)
                                        }
                                    }
                                }

                                try {
                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(
                                        lifecycleOwner,
                                        CameraSelector.DEFAULT_BACK_CAMERA,
                                        preview,
                                        imageAnalysis
                                    )
                                } catch (e: Exception) {
                                    Log.e("BarcodeScanner", "Camera bind error", e)
                                }
                            }, executor)

                            previewView
                        }
                    )

                    // Viewfinder Reticle
                    Box(
                        modifier = Modifier
                            .size(210.dp, 120.dp)
                            .align(Alignment.Center)
                            .border(
                                width = 2.dp,
                                color = if (showSuccessFeedback) Emerald500 else Color.White.copy(alpha = 0.6f),
                                shape = RoundedCornerShape(10.dp)
                            )
                    )

                    // On-screen visual flash & confirmation feedback
                    AnimatedVisibility(
                        visible = showSuccessFeedback,
                        enter = fadeIn(),
                        exit = fadeOut(),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Emerald600.copy(alpha = 0.35f), shape = RoundedCornerShape(14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color.Black.copy(alpha = 0.85f),
                                shadowElevation = 6.dp
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = "Scanned",
                                        tint = Emerald500,
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Column {
                                        Text("Item Added!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        if (lastScannedDisplay.isNotBlank()) {
                                            Text("#$lastScannedDisplay", color = Color(0xFFA7F3D0), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Live Cart Status Summary
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.ShoppingBag, contentDescription = null, modifier = Modifier.size(16.dp), tint = Emerald600)
                            Text(
                                text = if (cartItemCount == 1) "1 item in cart" else "$cartItemCount items in cart",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 12.sp
                            )
                        }
                        Text(
                            text = "$currencySymbol${String.format(Locale.getDefault(), "%.2f", cartTotal)}",
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp,
                            color = Emerald600
                        )
                    }
                }
            }
        }
    )
}

private fun triggerVibration(context: Context) {
    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator?.vibrate(
                VibrationEffect.createOneShot(70L, VibrationEffect.DEFAULT_AMPLITUDE)
            )
        } else {
            @Suppress("DEPRECATION")
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(
                    VibrationEffect.createOneShot(70L, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(70L)
            }
        }
    } catch (_: Exception) {
        // Vibrator service unavailable
    }
}

@OptIn(androidx.camera.core.ExperimentalGetImage::class)
private fun processImageProxy(
    scanner: com.google.mlkit.vision.barcode.BarcodeScanner,
    imageProxy: ImageProxy,
    onSuccess: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    barcode.rawValue?.let { code ->
                        if (code.isNotBlank()) {
                            onSuccess(code)
                            break
                        }
                    }
                }
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}
