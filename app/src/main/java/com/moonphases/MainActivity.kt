package com.moonphases

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.slider.Slider

class MainActivity : AppCompatActivity() {
    
    private lateinit var moonPhaseView: MoonPhaseView
    private lateinit var phaseSlider: Slider
    private lateinit var phaseNameText: TextView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        moonPhaseView = findViewById(R.id.moonPhaseView)
        phaseSlider = findViewById(R.id.phaseSlider)
        phaseNameText = findViewById(R.id.phaseNameText)
        
        phaseSlider.value = 0f
        
        phaseSlider.addOnChangeListener { _, value, _ ->
            moonPhaseView.setMoonPhase(value)
            updatePhaseNameText(value)
        }
        
        updatePhaseNameText(0f)
    }
    
    private fun updatePhaseNameText(phase: Float) {
        val phaseName = when {
            phase < 0.0625f -> getString(R.string.new_moon)
            phase < 0.1875f -> getString(R.string.waxing_crescent)
            phase < 0.3125f -> getString(R.string.first_quarter)
            phase < 0.4375f -> getString(R.string.waxing_gibbous)
            phase < 0.5625f -> getString(R.string.full_moon)
            phase < 0.6875f -> getString(R.string.waning_gibbous)
            phase < 0.8125f -> getString(R.string.last_quarter)
            phase < 0.9375f -> getString(R.string.waning_crescent)
            else -> getString(R.string.new_moon)
        }
        phaseNameText.text = phaseName
    }
}
