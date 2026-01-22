package com.moonphases

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.util.AttributeSet
import android.view.View
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

class MoonPhaseView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    companion object {
        private const val FULL_CIRCLE_RADIANS = 2 * Math.PI
    }

    private var moonPhase = 0f
    
    private val sunPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FDB813")
        style = Paint.Style.FILL
    }
    
    private val earthPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#4A90E2")
        style = Paint.Style.FILL
    }
    
    private val moonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#C0C0C0")
        style = Paint.Style.FILL
    }
    
    private val moonShadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#505050")
        style = Paint.Style.FILL
    }
    
    private val lightRayPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFF9C4")
        style = Paint.Style.STROKE
        strokeWidth = 2f
        alpha = 128
    }
    
    private val lightRayFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFF9C4")
        style = Paint.Style.FILL
        alpha = 32
    }
    
    private val orbitPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFFFFF")
        style = Paint.Style.STROKE
        strokeWidth = 1f
        alpha = 64
    }
    
    private val observerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FF6B6B")
        style = Paint.Style.FILL
    }
    
    fun setMoonPhase(phase: Float) {
        moonPhase = phase
        invalidate()
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        val centerX = width / 2f
        val centerY = height / 2f
        val scale = min(width, height) / 10f
        
        // Draw orbit path for moon around earth
        val orbitRadius = scale * 2.5f
        canvas.drawCircle(centerX, centerY, orbitRadius, orbitPaint)
        
        // Calculate moon position based on phase (0 = new moon = between earth and sun)
        val moonAngle = moonPhase * FULL_CIRCLE_RADIANS
        val moonX = centerX + (orbitRadius * cos(moonAngle)).toFloat()
        val moonY = centerY + (orbitRadius * sin(moonAngle)).toFloat()
        
        // Draw sun on the left
        val sunX = centerX - scale * 4f
        val sunY = centerY
        val sunRadius = scale * 0.8f
        
        // Draw light rays from sun to moon area
        drawLightRays(canvas, sunX, sunY, moonX, moonY, scale)
        
        // Draw sun with glow
        sunPaint.alpha = 80
        canvas.drawCircle(sunX, sunY, sunRadius * 1.4f, sunPaint)
        sunPaint.alpha = 255
        canvas.drawCircle(sunX, sunY, sunRadius, sunPaint)
        
        // Draw earth at center
        val earthRadius = scale * 0.6f
        canvas.drawCircle(centerX, centerY, earthRadius, earthPaint)
        
        // Draw observer on earth (facing the moon)
        val observerAngle = moonAngle
        val observerX = centerX + (earthRadius * cos(observerAngle)).toFloat()
        val observerY = centerY + (earthRadius * sin(observerAngle)).toFloat()
        canvas.drawCircle(observerX, observerY, scale * 0.1f, observerPaint)
        
        // Draw light ray from moon to observer
        lightRayPaint.alpha = 180
        canvas.drawLine(moonX, moonY, observerX, observerY, lightRayPaint)
        
        // Draw moon with phase
        drawMoon(canvas, moonX, moonY, scale * 0.4f, moonAngle)
    }
    
    private fun drawLightRays(canvas: Canvas, sunX: Float, sunY: Float, moonX: Float, moonY: Float, scale: Float) {
        // Draw several light rays from sun toward moon
        val numRays = 5
        val spreadAngle = Math.PI / 8
        
        val sunToMoonAngle = Math.atan2((moonY - sunY).toDouble(), (moonX - sunX).toDouble())
        
        for (i in 0 until numRays) {
            val offset = (i - numRays / 2) * spreadAngle / numRays
            val rayAngle = sunToMoonAngle + offset
            
            val rayLength = scale * 6f
            val endX = sunX + (rayLength * cos(rayAngle)).toFloat()
            val endY = sunY + (rayLength * sin(rayAngle)).toFloat()
            
            lightRayPaint.alpha = 60
            canvas.drawLine(sunX, sunY, endX, endY, lightRayPaint)
        }
        
        // Draw light cone
        val path = Path()
        path.moveTo(sunX, sunY)
        
        val topAngle = sunToMoonAngle - spreadAngle / 2
        val bottomAngle = sunToMoonAngle + spreadAngle / 2
        val coneLength = scale * 6f
        
        val topX = sunX + (coneLength * cos(topAngle)).toFloat()
        val topY = sunY + (coneLength * sin(topAngle)).toFloat()
        val bottomX = sunX + (coneLength * cos(bottomAngle)).toFloat()
        val bottomY = sunY + (coneLength * sin(bottomAngle)).toFloat()
        
        path.lineTo(topX, topY)
        path.lineTo(bottomX, bottomY)
        path.close()
        
        canvas.drawPath(path, lightRayFillPaint)
    }
    
    private fun drawMoon(canvas: Canvas, x: Float, y: Float, radius: Float, moonAngle: Double) {
        // Moon is lit from the sun's direction (left side)
        // Angle 0 (new moon): moon is between earth and sun, dark side faces earth
        // Angle π/2 (first quarter): right half lit
        // Angle π (full moon): fully lit
        // Angle 3π/2 (last quarter): left half lit
        
        val sunAngle = Math.PI // Sun is on the left
        val litSideAngle = sunAngle - moonAngle
        
        // Draw full moon circle
        canvas.drawCircle(x, y, radius, moonPaint)
        
        // Calculate how much shadow to show
        val shadowAmount = cos(litSideAngle).toFloat()
        
        if (shadowAmount < 0) {
            // Moon is more than half lit, draw shadow on right
            val path = Path()
            path.addCircle(x, y, radius, Path.Direction.CW)
            
            val shadowPath = Path()
            shadowPath.moveTo(x, y - radius)
            
            // Right side of moon
            shadowPath.lineTo(x + radius, y - radius)
            shadowPath.lineTo(x + radius, y + radius)
            shadowPath.lineTo(x, y + radius)
            
            // Arc back through the shadow
            val controlOffset = radius * -shadowAmount
            shadowPath.quadTo(x + controlOffset, y, x, y - radius)
            shadowPath.close()
            
            canvas.drawPath(shadowPath, moonShadowPaint)
        } else {
            // Moon is less than half lit, draw shadow on left
            val path = Path()
            path.moveTo(x, y - radius)
            
            // Left side of moon
            path.lineTo(x - radius, y - radius)
            path.lineTo(x - radius, y + radius)
            path.lineTo(x, y + radius)
            
            // Arc back through the shadow
            val controlOffset = radius * shadowAmount
            path.quadTo(x - controlOffset, y, x, y - radius)
            path.close()
            
            canvas.drawPath(path, moonShadowPaint)
        }
    }
}
