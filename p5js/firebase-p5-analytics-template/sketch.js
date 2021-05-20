function setup() {
    noCanvas()
    noLoop()
    triggerDimension = select('#trigger-dimension').mousePressed( () => {
        analytics.logEvent('trigger_demo', { label: 'a user just clicked the trigger dimension button'});
        console.log('just fired trigger to ga')
    })
    triggerMetrics = select('#trigger-metric').mousePressed( () => {
        analytics.logEvent('trigger_metric', 1);
        console.log('just fired trigger metric to ga')
    })
}

