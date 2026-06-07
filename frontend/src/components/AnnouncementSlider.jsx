import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../apiConfig";

import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

/* ─── Hook: detect mobile breakpoint ─── */
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
    );
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= breakpoint);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [breakpoint]);
    return isMobile;
};

const AnnouncementSlider = () => {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isMobile = useIsMobile();

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/api/announcements`)
            .then(res => {
                if (Array.isArray(res.data.data)) {
                    setSlides(res.data.data);
                    setIndex(0);
                }
            })
            .catch(err => console.error("Announcement fetch error:", err));
    }, []);

    // Auto-advance slider
    useEffect(() => {
        if (slides.length <= 1 || isDragging || isHovered || lightboxOpen) return;
        const timer = setTimeout(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [slides.length, index, isDragging, isHovered, lightboxOpen]);

    // Keyboard nav for lightbox
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKey = (e) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") lightboxNext();
            if (e.key === "ArrowLeft") lightboxPrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [lightboxOpen, lightboxIndex, slides.length]);

    // ── On mobile: render nothing (slider is shown inline in Login instead) ──
    // Change the condition below to `false` if you want to always show the slider.
    if (isMobile) return null;

    if (!slides.length) {
        return (
            <div style={{
                width: "900px",
                height: "700px",
                background: "#f2f2f2",
                borderRadius: "30px",
                marginRight: "300px",
                marginTop: "-130px",
                marginLeft: "125px",
            }} />
        );
    }

    const handleDragEnd = (_, info) => {
        const threshold = 80;
        if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) {
            setIsDragging(false);
            return;
        }
        if (info.offset.x < -threshold) setIndex(prev => (prev + 1) % slides.length);
        else if (info.offset.x > threshold) setIndex(prev => (prev - 1 + slides.length) % slides.length);
        setIsDragging(false);
    };

    const goNext = () => setIndex(prev => (prev + 1) % slides.length);
    const goPrev = () => setIndex(prev => (prev - 1 + slides.length) % slides.length);

    const openLightbox = () => {
        setLightboxIndex(index);
        setZoom(1);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setZoom(1);
    };

    const lightboxNext = () => {
        setLightboxIndex(prev => (prev + 1) % slides.length);
        setZoom(1);
    };

    const lightboxPrev = () => {
        setLightboxIndex(prev => (prev - 1 + slides.length) % slides.length);
        setZoom(1);
    };

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));

    const current = slides[index];
    const lightboxCurrent = slides[lightboxIndex];
    if (!current?.file_path) return null;

    return (
        <>
            {/* ─── SLIDER (desktop only) ─── */}
            <div
                style={{
                    width: "900px",
                    height: "700px",
                    marginRight: "300px",
                    background: "#000",
                    display: "flex",
                    marginTop: "-130px",
                    alignItems: "center",
                    marginLeft: "125px",
                    justifyContent: "center",
                    borderRadius: "30px",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <IconButton
                    onClick={goPrev}
                    sx={{
                        position: "absolute", left: 10, top: "50%",
                        transform: "translateY(-50%)", zIndex: 10,
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        "&:hover": { background: "rgba(0,0,0,0.8)" }
                    }}
                >
                    <ArrowBackIosNewIcon />
                </IconButton>

                <IconButton
                    onClick={goNext}
                    sx={{
                        position: "absolute", right: 10, top: "50%",
                        transform: "translateY(-50%)", zIndex: 10,
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        "&:hover": { background: "rgba(0,0,0,0.8)" }
                    }}
                >
                    <ArrowForwardIosIcon />
                </IconButton>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id}
                        drag="x"
                        dragDirectionLock
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.02}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={handleDragEnd}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                            cursor: isDragging ? "grabbing" : "grab",
                        }}
                    >
                        <div
                            onClick={() => !isDragging && openLightbox()}
                            style={{ width: "100%", height: "100%", position: "relative" }}
                        >
                            <img
                                src={`${API_BASE_URL}/uploads/Announcement/${current.file_path}`}
                                alt={current.title}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                }}
                                draggable={false}
                            />
                            <div style={{
                                position: "absolute", top: 12, right: 12,
                                background: "rgba(0,0,0,0.5)", borderRadius: "50%",
                                padding: "6px", display: "flex", alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <ZoomInIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </div>
                        </div>

                        <div style={{
                            position: "absolute", bottom: 0, width: "100%",
                            padding: "1.2rem", background: "rgba(0,0,0,0.6)", color: "#fff",
                            pointerEvents: "none",
                        }}>
                            <h3 style={{ margin: 0 }}>{current.title}</h3>
                            <p style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}>{current.content}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ─── LIGHTBOX MODAL ─── */}
            <AnimatePresence>
                {lightboxOpen && lightboxCurrent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={closeLightbox}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            background: "rgba(0,0,0,0.85)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: -55,
                                    left: -480,
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                }}
                            >
                                <IconButton
                                    onClick={closeLightbox}
                                    sx={{
                                        background: "rgba(255,255,255,0.15)",
                                        color: "#fff",
                                        width: 75,
                                        height: 75,
                                        "&:hover": { background: "rgba(220,50,50,0.75)" },
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: 28 }} />
                                </IconButton>
                            </div>

                            <div style={{
                                overflow: "auto",
                                maxWidth: "85vw", maxHeight: "80vh",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "12px",
                            }}>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={lightboxCurrent.id}
                                        src={`${API_BASE_URL}/uploads/Announcement/${lightboxCurrent.file_path}`}
                                        alt={lightboxCurrent.title}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            transform: `scale(${zoom})`,
                                            transformOrigin: "center center",
                                            transition: "transform 0.25s ease",
                                            maxWidth: "85vw",
                                            maxHeight: "80vh",
                                            objectFit: "contain",
                                            display: "block",
                                            borderRadius: "12px",
                                            userSelect: "none",
                                        }}
                                        draggable={false}
                                    />
                                </AnimatePresence>
                            </div>

                            <div style={{ marginTop: "12px", color: "#fff", textAlign: "center" }}>
                                <h3 style={{ margin: 0 }}>{lightboxCurrent.title}</h3>
                                <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                                    {lightboxCurrent.content}
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                                    {lightboxIndex + 1} / {slides.length}
                                </p>
                            </div>
                        </div>

                        <IconButton
                            onClick={e => { e.stopPropagation(); lightboxPrev(); }}
                            sx={{
                                position: "fixed", left: 50, top: "50%",
                                transform: "translateY(-50%)", zIndex: 10000,
                                width: 75, height: 75,
                                background: "rgba(255,255,255,0.15)", color: "#fff",
                                "&:hover": { background: "rgba(255,255,255,0.3)" },
                            }}
                        >
                            <ArrowBackIosNewIcon sx={{ fontSize: 28 }} />
                        </IconButton>

                        <IconButton
                            onClick={e => { e.stopPropagation(); lightboxNext(); }}
                            sx={{
                                position: "fixed", right: 50, top: "50%",
                                transform: "translateY(-50%)", zIndex: 10000,
                                width: 75, height: 75,
                                background: "rgba(255,255,255,0.15)", color: "#fff",
                                "&:hover": { background: "rgba(255,255,255,0.3)" },
                            }}
                        >
                            <ArrowForwardIosIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AnnouncementSlider;
