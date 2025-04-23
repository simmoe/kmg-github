let currentPage = 1;
let pages; // Array med alle sider
let client;

let ddu_sign_button, ddu_sign_active;
let night_mode_override_button, night_mode_override_active;
let sliderTimers = {}; // Store timers for each light

function setup() {    
    // Force reload knap
    select('#reload').mousePressed(() => {
        window.location.href = 'https://simmoe.github.io/kmg-controller/?forceReload=' + new Date().getTime();
    });

    pages = selectAll('.page');
    
    // DDU Sign knap
    ddu_sign_button = select('#ddu_sign')
      .mousePressed(() => {
          console.log('SIGN PRESSED');
          client.publish('DDU_INFINITY', ddu_sign_active ? 'off' : 'on');
      });

    // Night mode override knap
    night_mode_override_active = false;
    night_mode_override_button = select('#night_mode_override')
      .mousePressed(() => {
          // Toggle override-status
          night_mode_override_active = !night_mode_override_active;
          console.log('Night mode override toggled:', night_mode_override_active);
          // Hvis override aktiveres, sendes "off" (dvs. nattilstand deaktiveres midlertidigt)
          // Hvis override deaktiveres, sendes "on" for at genoptage nattilstanden
          client.publish('NIGHT_MODE_OVERRIDE', night_mode_override_active ? 'off' : 'on');
          // Opdater knapens visuelle status
          if(night_mode_override_active){
              night_mode_override_button.addClass('active');
          } else {
              night_mode_override_button.removeClass('active');
          }
      });

    client = mqtt.connect('wss://mqtt.nextservices.dk');

    client.on('connect', () => {
        console.log('MQTT connected');
        client.publish('DDU_CONTROLLER_CALL', 'DDU_INFINITY');

        // Abonner på relevante topics
        client.subscribe('DDU_CONTROLLER');
        client.subscribe('DDU_INFINITY');
        client.subscribe('HUE_CONTROLLER/status');

        console.log('Sending status request on: HUE_CONTROLLER_STATUS_REQUEST...');
        client.publish('HUE_CONTROLLER_STATUS_REQUEST', '{}');
    });

    client.on('message', (topic, message) => {
        let msg = message.toString();
        console.log(`Received on ${topic}`);

        if (topic === 'DDU_INFINITY') {
            // Hvis beskeden er "off", betyder det at nattilstand er aktiv (override ikke sat)
            // Hvis beskeden er "on", er det dag, eller override er aktiv
            if (msg === 'off') {
                night_mode_override_active = true;
                night_mode_override_button.addClass('active');
            } else if (msg === 'on') {
                night_mode_override_active = false;
                night_mode_override_button.removeClass('active');
            }
        }

        if (topic === 'DDU_CONTROLLER') {
            let ms = JSON.parse(msg);
            if (ms.control === 'DDU_INFINITY') {
                ddu_sign_active = ms.status;
                if(ddu_sign_active){
                    ddu_sign_button.addClass('active');
                } else {
                    ddu_sign_button.removeClass('active');
                }
            }
        }

        if (topic === 'HUE_CONTROLLER/status') {
            let ms = JSON.parse(msg);
            
            if (Array.isArray(ms)) {
              // Håndterer besked med enkelt lys (array med success-objekt)
              ms.forEach(item => {
                if (item.success) {
                  Object.entries(item.success).forEach(([key, value]) => {
                    // Ekstrakt lightNumber fra "/lights/14/state/on"
                    let match = key.match(/\/lights\/(\d+)\/state\/on/);
                    if (match) {
                      let lightNumber = match[1];
                      let on = value;  // Her antager vi, at checked er true/false
                      let button = select(`.control_button[data-lightnumber="${lightNumber}"]`);
                      if (button) {
                        // Vi har ikke brightness i denne besked – sæt evt. til null eller en default-værdi
                        updateHueButton(lightNumber, on, null);
                      }
                    }
                  });
                }
              });
            } else if (typeof ms === 'object') {
              // Håndterer besked med flere lys
              Object.entries(ms).forEach(([lightNumber, lightData]) => {
                //console.log('receives here', lightNumber);
                let button = select(`.control_button[data-lightnumber="${lightNumber}"]`);
                if (button) {
                  updateHueButton(lightNumber, lightData.state.on, lightData.state.bri);
                }
              });
            }
          }
    });

    // Find alle Hue-knapper og tilføj event listeners
    selectAll('.control_button[data-lightnumber]').forEach(button => {
        let lightNumber = button.attribute('data-lightnumber');
        button.mousePressed(() => {
            console.log(`HUE BUTTON PRESSED for light ${lightNumber}`);
            toggleHueLight(lightNumber);
        });
    });

    // Add event listeners to sliders
    selectAll('.color_slider').forEach(slider => {
        let lightNumber = slider.attribute('data-lightnumber');
        slider.input(() => {
            let value = slider.value();
            handleSliderChange(lightNumber, value);
            updateButtonColor(lightNumber, value);
        });
    });
}

function toggleHueLight(lightNumber) {
    let button = select(`.control_button[data-lightnumber="${lightNumber}"]`);
    if (!button) return;
    let isCurrentlyOn = button.hasClass('active'); // Tjekker om knappen er aktiv
    let newState = !isCurrentlyOn; // Skifter status
    let payload = JSON.stringify({ "light": lightNumber, "on": newState });
    client.publish('HUE_CONTROLLER_COMMAND', payload);
    console.log(`Toggling Light ${lightNumber} to: ${newState ? "ON" : "OFF"}`);
    updateHueButton(lightNumber, newState);
}

function updateHueButton(lightNumber, isActive, brightness) {
    let button = select(`.control_button[data-lightnumber="${lightNumber}"]`);
    if (!button) return;
    if(isActive){
        button.addClass('active');
    } else {
        button.removeClass('active');
    }
}

function handleSliderChange(lightNumber, value) {
    if (sliderTimers[lightNumber]) {
        clearTimeout(sliderTimers[lightNumber]);
    }

    sliderTimers[lightNumber] = setTimeout(() => {
        let xy = mapSliderToXY(value);
        let payload = JSON.stringify({ "light": lightNumber, "xy": xy });
        client.publish('HUE_CONTROLLER_COMMAND', payload);
        console.log(`Updated Light ${lightNumber} to XY:`, xy);
    }, 500); // Throttle to twice per second
}

function mapSliderToXY(value) {
    // Map slider value (0-100) to a path in the CIE color space
    let x = 0.15 + (value / 100) * 0.7; // Example mapping for x
    let y = 0.15 + (value / 100) * 0.7; // Example mapping for y
    return [x, y];
}

function updateButtonColor(lightNumber, value) {
    let button = select(`.control_button[data-lightnumber="${lightNumber}"]`);
    if (button) {
        let xy = mapSliderToXY(value);
        let rgb = convertXYToRGB(xy[0], xy[1]);
        button.style('background-color', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }
}

function convertXYToRGB(x, y) {
    // Assume a fixed brightness for simplicity
    let brightness = 1.0;

    // Calculate z coordinate
    let z = 1.0 - x - y;

    // Convert to RGB using the CIE formula
    let Y = brightness;
    let X = (Y / y) * x;
    let Z = (Y / y) * z;

    // Convert to linear RGB
    let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    // Apply gamma correction and clamp values
    r = r <= 0.0031308 ? 12.92 * r : (1.055 * Math.pow(r, 1.0 / 2.4) - 0.055);
    g = g <= 0.0031308 ? 12.92 * g : (1.055 * Math.pow(g, 1.0 / 2.4) - 0.055);
    b = b <= 0.0031308 ? 12.92 * b : (1.055 * Math.pow(b, 1.0 / 2.4) - 0.055);

    // Clamp values to [0, 255]
    r = Math.max(0, Math.min(255, Math.round(r * 255)));
    g = Math.max(0, Math.min(255, Math.round(g * 255)));
    b = Math.max(0, Math.min(255, Math.round(b * 255)));

    return { r, g, b };
}
