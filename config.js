const CONFIG = {
    forceTheme: "dark", 
    eventName: "Programmer's Day 2026",
    eventSubtitle: "Select your animatronic and download your avatar.",

    logoFile: "logo.png",
    bannerFile: "banner.png",

    frames: [
        { id: "freddy", title: "Freddy", file: "freddy.png", thumb: "freddy_thumb.png", color: "#f97316" },
        { id: "foxy",   title: "Foxy",   file: "foxy.png",   thumb: "foxy_thumb.png",   color: "#ef4444" },
        { id: "bonnie", title: "Bonnie", file: "bonnie.png", thumb: "bonnie_thumb.png", color: "#a855f7" },        
        { id: "chica",  title: "Chica",  file: "chica.png",  thumb: "chica_thumb.png",  color: "#eab308" }
    ],

    exportResolution: 2000, 
    canvasSize: 320,        
    maxSafeDimension: 2500, 
    allowedMIMEs: ['image/jpeg', 'image/png', 'image/webp']
};