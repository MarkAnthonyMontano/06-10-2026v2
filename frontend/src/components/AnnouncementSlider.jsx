import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../apiConfig";

import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

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

/* ─── Formats announcement content into JSX with bullets / line-breaks ─── */
const FormattedContent = ({ text }) => {
    if (!text) return null;
    const lines = text.split("\n");
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} style={{ height: "6px" }} />;

                const bulletMatch = trimmed.match(/^([•\*\-–])\s+(.*)/);
                if (bulletMatch) {
                    return (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ color: "#fff", marginTop: "2px", flexShrink: 0, fontSize: "14px" }}>•</span>
                            <span style={{ color: "rgba(255,255,255,0.92)", fontSize: "13.5px", lineHeight: 1.55 }}>
                                {bulletMatch[2]}
                            </span>
                        </div>
                    );
                }

                const subBulletMatch = line.match(/^[\s\t]+([•\*\-–])\s+(.*)/);
                if (subBulletMatch) {
                    return (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", paddingLeft: "18px" }}>
                            <span style={{ color: "rgba(255,255,255,0.55)", marginTop: "2px", flexShrink: 0, fontSize: "12px" }}>◦</span>
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: 1.55 }}>
                                {subBulletMatch[2]}
                            </span>
                        </div>
                    );
                }

                const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed);
                if (isHeading) {
                    return (
                        <p key={i} style={{ margin: "6px 0 2px", color: "#fff", fontWeight: 700, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75 }}>
                            {trimmed}
                        </p>
                    );
                }

                return (
                    <p key={i} style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "13.5px", lineHeight: 1.6 }}>
                        {trimmed}
                    </p>
                );
            })}
        </div>
    );
};

const AnnouncementSlider = () => {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [contentOpen, setContentOpen] = useState(true); // ← toggle state
    const isMobile = useIsMobile();

    /* Lightbox */
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

    /* Auto-advance */
    useEffect(() => {
        if (slides.length <= 1 || isDragging || isHovered || lightboxOpen) return;
        const timer = setTimeout(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [slides.length, index, isDragging, isHovered, lightboxOpen]);

    /* Keyboard nav for lightbox */
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
        if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) { setIsDragging(false); return; }
        if (info.offset.x < -threshold) setIndex(prev => (prev + 1) % slides.length);
        else if (info.offset.x > threshold) setIndex(prev => (prev - 1 + slides.length) % slides.length);
        setIsDragging(false);
    };

    const goNext = () => setIndex(prev => (prev + 1) % slides.length);
    const goPrev = () => setIndex(prev => (prev - 1 + slides.length) % slides.length);

    const openLightbox = () => { setLightboxIndex(index); setZoom(1); setLightboxOpen(true); };
    const closeLightbox = () => { setLightboxOpen(false); setZoom(1); };
    const lightboxNext = () => { setLightboxIndex(prev => (prev + 1) % slides.length); setZoom(1); };
    const lightboxPrev = () => { setLightboxIndex(prev => (prev - 1 + slides.length) % slides.length); setZoom(1); };

    const current = slides[index];
    const lightboxCurrent = slides[lightboxIndex];
    if (!current) return null;

    const hasImage = !!current.file_path;
    const hasContent = !!(current.content?.trim());

    return (
        <>
            {/* ─── SLIDER (desktop only) ─── */}
            <div
                style={{
                    width: "900px",
                    height: "700px",
                    marginRight: "300px",
                    marginTop: "-130px",
                    marginLeft: "125px",
                    background: "#111",
                    borderRadius: "30px",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Prev / Next arrows */}
                <IconButton
                    onClick={goPrev}
                    sx={{
                        position: "absolute", left: 10, top: "50%",
                        transform: "translateY(-50%)", zIndex: 10,
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        "&:hover": { background: "rgba(0,0,0,0.85)" }
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
                        "&:hover": { background: "rgba(0,0,0,0.85)" }
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
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={handleDragEnd}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "row",
                            cursor: isDragging ? "grabbing" : "grab",
                            position: "relative",
                        }}
                    >
                        {/* ── Left: Image pane ── */}
                        {hasImage && (
                            <motion.div
                                animate={{
                                    flex: hasContent && contentOpen ? "0 0 55%" : "1 1 100%",
                                }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                style={{
                                    position: "relative",
                                    overflow: "hidden",
                                    background: "#000",
                                    flexShrink: 0,
                                }}
                                onClick={() => !isDragging && openLightbox()}
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
                                        display: "block",
                                    }}
                                    draggable={false}
                                />

                                {/* Zoom hint */}
                                <div style={{
                                    position: "absolute", top: 10, right: 10,
                                    background: "rgba(0,0,0,0.55)", borderRadius: "50%",
                                    padding: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <ZoomInIcon sx={{ color: "#fff", fontSize: 20 }} />
                                </div>

                                {/* Title overlay (only if no content panel or panel is closed) */}
                                {(!hasContent || !contentOpen) && (
                                    <div style={{
                                        position: "absolute", bottom: 0, width: "100%",
                                        padding: "1.2rem", background: "black",
                                        color: "#fff", pointerEvents: "none",
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: "18px" }}>{current.title}</h3>
                                    </div>
                                )}

                                {/* ── Toggle button on the right edge of image (only when has content) ── */}
                                {hasContent && (
                                    <div
                                        onClick={e => { e.stopPropagation(); setContentOpen(prev => !prev); }}
                                        title={contentOpen ? "Hide details" : "Show details"}
                                        style={{
                                            position: "absolute",
                                            right: 0,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            zIndex: 20,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "4px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div style={{
                                            background: "black",
                                            backdropFilter: "blur(6px)",
                                            border: "1px solid rgba(255,255,255,0.25)",
                                            borderRadius: "12px 0 0 12px",
                                            padding: "10px 6px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "background 0.2s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "black"}
                                            onMouseLeave={e => e.currentTarget.style.background = "black"}
                                        >
                                            {/* Animated chevron */}
                                            <motion.div
                                                animate={{ rotate: contentOpen ? 0 : 180 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ChevronRightIcon sx={{ color: "#fff", fontSize: 20 }} />
                                            </motion.div>

                                            {/* Vertical label */}
                                            <span style={{
                                                color: "rgba(255,255,255,0.85)",
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                letterSpacing: "0.12em",
                                                textTransform: "uppercase",
                                                writingMode: "vertical-rl",
                                                textOrientation: "mixed",
                                                transform: "rotate(180deg)",
                                                lineHeight: 1,
                                            }}>
                                                {contentOpen ? "Close" : "Details"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Right: Content pane (animated open/close) ── */}
                        <AnimatePresence initial={false}>
                            {hasContent && contentOpen && (
                                <motion.div
                                    key="content-panel"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "45%", opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    style={{
                                        flexShrink: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
                                        padding: "24px 20px 20px",
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                        scrollbarWidth: "thin",
                                        scrollbarColor: "rgba(255,255,255,0.2) transparent",
                                    }}
                                >
                                    {/* Title */}
                                    <h3 style={{
                                        margin: "0 0 4px",
                                        color: "#fff",
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        lineHeight: 1.4,
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}>
                                        {current.title}
                                    </h3>

                                    {/* Divider */}
                                    <div style={{
                                        width: "36px", height: "3px",
                                        background: "rgba(255,255,255,0.35)",
                                        borderRadius: "2px",
                                        margin: "8px 0 14px",
                                        flexShrink: 0,
                                    }} />

                                    {/* Formatted content */}
                                    <div style={{ flex: 1, overflow: "visible" }}>
                                        <FormattedContent text={current.content} />
                                    </div>

                                    {/* Slide counter */}
                                    {slides.length > 1 && (
                                        <div style={{
                                            marginTop: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            flexShrink: 0,
                                        }}>
                                            {slides.map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                                                    style={{
                                                        width: i === index ? 18 : 6,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: i === index ? "#fff" : "rgba(255,255,255,0.3)",
                                                        transition: "all 0.3s",
                                                        cursor: "pointer",
                                                    }}
                                                />
                                            ))}
                                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginLeft: "4px" }}>
                                                {index + 1} / {slides.length}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Dots when image-only (no content or content closed) */}
                        {hasImage && (!hasContent || !contentOpen) && slides.length > 1 && (
                            <div style={{
                                position: "absolute", bottom: 12, right: 16,
                                display: "flex", gap: "6px", zIndex: 5,
                            }}>
                                {slides.map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                                        style={{
                                            width: i === index ? 18 : 6, height: 6,
                                            borderRadius: 3,
                                            background: i === index ? "#fff" : "rgba(255,255,255,0.4)",
                                            transition: "all 0.3s", cursor: "pointer",
                                        }}
                                    />
                                ))}
                            </div>
                        )}
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
                            background: "rgba(0,0,0,0.88)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
                            <div style={{ position: "absolute", top: -55, left: -480, display: "flex", gap: "8px", alignItems: "center" }}>
                                <IconButton
                                    onClick={closeLightbox}
                                    sx={{
                                        background: "rgba(255,255,255,0.15)", color: "#fff",
                                        width: 75, height: 75,
                                        "&:hover": { background: "rgba(220,50,50,0.75)" },
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: 28 }} />
                                </IconButton>
                            </div>

                            <div style={{
                                overflow: "auto", maxWidth: "85vw", maxHeight: "80vh",
                                display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px",
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
                                            maxWidth: "85vw", maxHeight: "80vh",
                                            objectFit: "contain", display: "block",
                                            borderRadius: "12px", userSelect: "none",
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

                        <IconButton onClick={e => { e.stopPropagation(); lightboxPrev(); }}
                            sx={{ position: "fixed", left: 50, top: "50%", transform: "translateY(-50%)", zIndex: 10000, width: 75, height: 75, background: "rgba(255,255,255,0.15)", color: "#fff", "&:hover": { background: "rgba(255,255,255,0.3)" } }}>
                            <ArrowBackIosNewIcon sx={{ fontSize: 28 }} />
                        </IconButton>

                        <IconButton onClick={e => { e.stopPropagation(); lightboxNext(); }}
                            sx={{ position: "fixed", right: 50, top: "50%", transform: "translateY(-50%)", zIndex: 10000, width: 75, height: 75, background: "rgba(255,255,255,0.15)", color: "#fff", "&:hover": { background: "rgba(255,255,255,0.3)" } }}>
                            <ArrowForwardIosIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AnnouncementSlider;