const CONFIG = {
    forceTheme: "dark", 
    eventName: "Programmer's Day 2026",
    eventSubtitle: "Upload your photo. Select your animatronic and download your avatar.",

    logoFile: "logo.png",
    bannerFile: "banner.png",

    frames: [
        { id: "freddy", title: "Freddy", file: "freddy.png", color: "#f97316" },
        { id: "foxy",   title: "Foxy",   file: "foxy.png",   color: "#ef4444" },
        { id: "chica",  title: "Chica",  file: "chica.png",  color: "#eab308" },
        { id: "bonnie", title: "Bonnie", file: "bonnie.png", color: "#a855f7" }
    ],
    
    exportResolution: 2000, 
    canvasSize: 320,        
    maxSafeDimension: 2500, 
    allowedMIMEs: ['image/jpeg', 'image/png', 'image/webp']
};