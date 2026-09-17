package com.cicada.posbilling.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Emerald500,
    secondary = Emerald600,
    tertiary = Emerald700,
    background = Zinc900,
    surface = Zinc800,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = Emerald600,
    secondary = Emerald500,
    tertiary = Emerald700,
    background = Zinc50,
    surface = Color.White,
    onPrimary = Color.White,
    onBackground = Zinc900,
    onSurface = Zinc900
)

@Composable
fun PosBillingTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
