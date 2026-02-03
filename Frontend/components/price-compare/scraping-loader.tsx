"use client"

import { useState, useEffect } from "react"

const platforms = ["Amazon", "Flipkart", "Myntra", "Reliance Digital"]

export function ScrapingLoader() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % platforms.length)
        setIsAnimating(false)
      }, 300)
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pc-scraping-loader-wrapper">
      <div className="pc-scraping-loader-card">
        <div className="pc-loader-content">
          <div className="pc-loader-icon-container">
            <svg className="pc-spinner-large" viewBox="0 0 48 48" fill="none">
              <circle
                className="pc-spinner-track-large"
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
              />
              <circle
                className="pc-spinner-progress-large"
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
          </div>

          <div className="pc-loader-text-section">
            <div className="pc-loader-main-text">
              <span className="pc-scraping-label">Scraping</span>
              <div className="pc-platform-wrapper">
                <span
                  key={currentIndex}
                  className={`pc-platform-text ${isAnimating ? "pc-platform-exit" : "pc-platform-enter"}`}
                >
                  {platforms[currentIndex]}
                </span>
              </div>
            </div>
          </div>

          <div className="pc-loader-dots-container">
            <span className="pc-dot-large pc-dot-1"></span>
            <span className="pc-dot-large pc-dot-2"></span>
            <span className="pc-dot-large pc-dot-3"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
