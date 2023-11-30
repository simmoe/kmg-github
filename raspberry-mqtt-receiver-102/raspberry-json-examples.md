# Raspberry json examples

Each json object must have "content" property.
Valid properties for content are 
- webpage
- youtube
- html
- reload

### Parameter howlong 
unit is milliseconds

## webpage
// Valid content = webpage, youtube, html, reload
// webpage - show dr.dk
```
{
    "content": "webpage",
    "webpage": "https://lectio.dk", 
    "howlong": "5000"
}
```

## youtube
Shows a fireplace video from youtube
```
{
    "content": "youtube",
    "embed": "<iframe width='560' height='315' src='https://www.youtube.com/embed/AHLosy_nqWw?si=ETTCL4UH1trt-JRP' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowfullscreen></iframe>", 
    "howlong": "5000"
}
```

## html
Display some html.
```
{
    "content": "html",
    "html": "<h2>Jeg tester html</h2>", 
    "howlong": "5000"
}
```
## reload
Reloads page?
```
{
    "content": "reload"
}
```
