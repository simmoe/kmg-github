let currentPage = 1;
let pages; // Array med alle sider
let client;

let ddu_sign_button, ddu_sign_active;
let night_mode_override_button, night_mode_override_active;

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
        console.log(`Received on ${topic}:`, msg);

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
            Object.entries(ms).forEach(([lightNumber, lightData]) => {
                let button = select(`.control_button[data-lightnumber="${lightNumber}"]`);
                if (button) {
                    updateHueButton(lightNumber, lightData.state.on, lightData.state.bri);
                }
            });
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
