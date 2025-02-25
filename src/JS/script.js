document.addEventListener('DOMContentLoaded', () => {
  const testTime = 1000

  const defaultZones = {
    front: { time: 1, order: 1 },
    back: { time: 1, order: 2 },
    right: { time: 1, order: 3 },
    left: { time: 1, order: 4 }
  }

  const zones = JSON.parse(JSON.stringify(defaultZones))
  console.log(zones)

  let selectedZone = 'front'
  let timerInterval
  let elapsedSeconds = 0
  let isRunning = false
  let stopHighlighting = false

  const zoneSelectInputs = document.querySelectorAll('.zone-select-input input[type="radio"]')
  const zoneTimeInput = document.getElementById('zone-time')
  const zoneOrderInput = document.getElementById('zone-order')
  const runModeCheckbox = document.getElementById('run-mode')
  const powerButton = document.getElementById('power-btn')
  const resetButton = document.querySelector('.reset-btn')
  const timerDisplay = document.querySelector('.timer-box')
  const indicators = {
    front: document.getElementById('front-indicator'),
    back: document.getElementById('back-indicator'),
    right: document.getElementById('right-indicator'),
    left: document.getElementById('left-indicator')
  }

  /**
   *
   * @param zone
   */
  function updateZoneConfiguration (zone) {
    zoneTimeInput.value = zones[zone].time
    zoneOrderInput.value = zones[zone].order
    console.log(`Zone ${zone} selected:`, zones[zone])
  }

  function saveZoneConfiguration (zone) {
    if (zones[zone]) {
      zones[zone].time = parseInt(zoneTimeInput.value, 10)
      zones[zone].order = parseInt(zoneOrderInput.value, 10)
      console.log(`Zone ${zone} updated:`, zones[zone])
    }
  }

  function checkUniqueOrders () {
    const orders = {}
    for (const zone in zones) {
      const order = zones[zone].order
      if (orders[order]) {
        orders[order].push(zone)
      } else {
        orders[order] = [zone]
      }
    }

    const duplicates = Object.values(orders).filter(zones => zones.length > 1)
    if (duplicates.length > 0) {
      const duplicateZones = duplicates.map(zones => zones.join(', ')).join(' and ')
      alert(`The following zones have the same order: ${duplicateZones}. Resetting to default values.`)

      for (const zone in zones) {
        zones[zone].time = defaultZones[zone].time
        zones[zone].order = defaultZones[zone].order
        console.log(`Zone ${zone} reset to default values:`, zones[zone])
      }

      return false
    }
    return true
  }

  async function highlightIndicators () {
    const sortedZones = Object.keys(zones).sort((a, b) => zones[a].order - zones[b].order)

    for (const zone of sortedZones) {
      if (stopHighlighting) break
      await new Promise(resolve => {
        indicators[zone].style.backgroundColor = 'var(--ind-color)'
        setTimeout(() => {
          indicators[zone].style.backgroundColor = ''
          resolve()
        }, zones[zone].time * testTime)
      })
    }
  }

  async function runHighlightLoop () {
    while (isRunning) {
      await highlightIndicators()
    }
  }

  function startTimer () {
    timerInterval = setInterval(async () => {
      elapsedSeconds++
      const minutes = Math.floor(elapsedSeconds / 60)
      const displaySeconds = elapsedSeconds % 60
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')} : ${String(displaySeconds).padStart(2, '0')}`

      if (elapsedSeconds % 60 === 0) {
        stopHighlighting = true
        await highlightIndicators()
        stopHighlighting = false
        runHighlightLoop()
      }
    }, testTime)
  }

  function stopTimer (reset = false) {
    clearInterval(timerInterval)
    if (reset) {
      elapsedSeconds = 0
      timerDisplay.textContent = '00 : 00'
    }
  }

  function resetIndicators () {
    for (const zone in indicators) {
      indicators[zone].style.backgroundColor = ''
    }
  }


  function stopProcess (resetTimer = false) {
    isRunning = false
    stopHighlighting = true
    stopTimer(resetTimer)
    resetIndicators()
  }

  async function handleRunModeChange () {
    if (runModeCheckbox.checked) {
      if (checkUniqueOrders()) {
        isRunning = true
        stopHighlighting = false
        startTimer()
        await runHighlightLoop()
      } else {
        runModeCheckbox.checked = false
        updateZoneConfiguration(selectedZone)
      }
    } else {
      stopProcess()
    }
  }

  function resetZonesToDefault () {
    for (const zone in zones) {
      zones[zone].time = defaultZones[zone].time
      zones[zone].order = defaultZones[zone].order
    }
    updateZoneConfiguration(selectedZone)
    console.log('All zones reset to default values:', zones)
  }

  zoneSelectInputs.forEach(input => {
    input.addEventListener('change', (event) => {
      selectedZone = event.target.value
      updateZoneConfiguration(selectedZone)
    })
  })

  zoneTimeInput.addEventListener('input', () => {
    saveZoneConfiguration(selectedZone)
  })

  zoneTimeInput.addEventListener('blur', () => {
    const timeValue = parseInt(zoneTimeInput.value, 10)
    if (timeValue < 1) {
      zoneTimeInput.value = 1
    } else if (timeValue > 15) {
      zoneTimeInput.value = 15
    }
    saveZoneConfiguration(selectedZone)
  })

  zoneOrderInput.addEventListener('input', () => {
    saveZoneConfiguration(selectedZone)
  })

  runModeCheckbox.addEventListener('change', handleRunModeChange)

  powerButton.addEventListener('click', () => {
    runModeCheckbox.checked = false
    stopProcess(true)
  })

  resetButton.addEventListener('click', () => {
    resetZonesToDefault()
  })

  updateZoneConfiguration('front')
})
