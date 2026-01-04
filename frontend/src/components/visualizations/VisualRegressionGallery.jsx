import { useState, useRef } from 'react'
import {
  X, Download, ZoomIn, ChevronLeft, ChevronRight, Maximize2,
  Monitor, Tablet, Smartphone, Camera, CheckCircle, XCircle,
  ImageIcon, AlertCircle, Layers, Eye, SplitSquareVertical
} from 'lucide-react'

// Before/After Comparison Slider Component
function BeforeAfterSlider({ beforeUrl, afterUrl, label }) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = (x / rect.width) * 100
    setSliderPosition(percentage)
  }

  const handleTouchMove = (e) => {
    if (!containerRef.current) return
    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
    const percentage = (x / rect.width) * 100
    setSliderPosition(percentage)
  }

  if (!beforeUrl || !afterUrl) return null

  return (
    <div
      ref={containerRef}
      className="ba-slider-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Before Image (Full width background) */}
      <div className="ba-before-image">
        <img src={beforeUrl} alt="Baseline" />
        <span className="ba-label ba-label-before">Baseline</span>
      </div>

      {/* After Image (Clipped by slider) */}
      <div
        className="ba-after-image"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img src={afterUrl} alt="Current" />
        <span className="ba-label ba-label-after">Current</span>
      </div>

      {/* Slider Handle */}
      <div
        className="ba-slider-handle"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="ba-slider-line" />
        <div className="ba-slider-button">
          <SplitSquareVertical size={18} />
        </div>
        <div className="ba-slider-line" />
      </div>

      <style>{`
        .ba-slider-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          border-radius: 12px;
          overflow: hidden;
          cursor: col-resize;
          background: #1e293b;
          border: 2px solid #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }

        .ba-before-image,
        .ba-after-image {
          position: absolute;
          inset: 0;
        }

        .ba-before-image img,
        .ba-after-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ba-label {
          position: absolute;
          bottom: 12px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ba-label-before {
          left: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #fbbf24;
          backdrop-filter: blur(4px);
        }

        .ba-label-after {
          right: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #34d399;
          backdrop-filter: blur(4px);
        }

        .ba-slider-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);
          cursor: col-resize;
          z-index: 10;
        }

        .ba-slider-line {
          flex: 1;
          width: 3px;
          background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .ba-slider-button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          cursor: col-resize;
          flex-shrink: 0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .ba-slider-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }

        .ba-slider-container:active .ba-slider-button {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  )
}

// Get the API base URL dynamically
const getApiBaseUrl = () => {
  // In production, use relative URL (nginx will proxy)
  // In development, use the backend URL
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    // If we're on localhost dev, point to backend port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3004'
    }
    // In production, use same origin (nginx proxy handles it)
    return `${protocol}//${hostname}`
  }
  return ''
}

/**
 * VisualRegressionGallery - Modern image gallery for visual regression results
 */
export function VisualRegressionGallery({ visualData, comparisons = [], baseUrl = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentView, setCurrentView] = useState('current')
  const [imageErrors, setImageErrors] = useState({})
  const [comparisonModeCards, setComparisonModeCards] = useState(new Set())

  // Toggle comparison mode for a specific card
  const toggleComparisonMode = (imageId) => {
    setComparisonModeCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  // Determine the correct base URL for screenshots
  const screenshotBaseUrl = baseUrl || `${getApiBaseUrl()}/screenshots`

  // Helper to construct full image URL
  const getImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    // Clean up the path - remove any leading slashes
    const cleanPath = path.replace(/^\/+/, '')
    return `${screenshotBaseUrl}/${cleanPath}`
  }

  // Build image list from visual data and comparisons
  const buildImageList = () => {
    const images = []

    // Parse comparisons if it's a JSON string
    let comparisonList = comparisons
    if (typeof comparisons === 'string') {
      try {
        comparisonList = JSON.parse(comparisons)
      } catch (e) {
        comparisonList = []
      }
    }

    if (!comparisonList || comparisonList.length === 0) {
      return images
    }

    // Process each comparison
    comparisonList.forEach((comparison, index) => {
      const isBaselineRun = comparison.is_baseline_run || visualData?.is_baseline_run

      images.push({
        id: `comparison-${index}`,
        name: comparison.viewport
          ? `${comparison.viewport.charAt(0).toUpperCase() + comparison.viewport.slice(1)}`
          : `Screenshot ${index + 1}`,
        baseline: comparison.baseline_exists ? getImageUrl(comparison.baseline_path) : null,
        current: getImageUrl(comparison.screenshot_path),
        diff: comparison.diff_path ? getImageUrl(comparison.diff_path) : null,
        similarity: comparison.difference_percentage !== undefined
          ? 100 - comparison.difference_percentage
          : 100,
        status: comparison.passed ? 'pass' : 'fail',
        viewport: `${comparison.width}x${comparison.height}`,
        width: comparison.width,
        height: comparison.height,
        isBaselineRun: isBaselineRun,
        pixelsChanged: comparison.pixels_changed || 0,
        totalPixels: comparison.total_pixels || 0,
        differencePercentage: comparison.difference_percentage || 0
      })
    })

    return images
  }

  const images = buildImageList()

  const getViewportIcon = (width) => {
    if (width >= 1200) return <Monitor size={16} />
    if (width >= 768) return <Tablet size={16} />
    return <Smartphone size={16} />
  }

  const openLightbox = (index, view = 'current') => {
    setCurrentImageIndex(index)
    setCurrentView(view)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleImageError = (imageId, viewType) => {
    setImageErrors(prev => ({
      ...prev,
      [`${imageId}-${viewType}`]: true
    }))
  }

  const handleDownload = (url, filename) => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.click()
  }

  // Calculate stats
  const stats = {
    total: images.length,
    passed: images.filter(img => img.status === 'pass').length,
    failed: images.filter(img => img.status === 'fail').length,
    avgSimilarity: images.length > 0
      ? (images.reduce((sum, img) => sum + img.similarity, 0) / images.length).toFixed(1)
      : 100
  }

  if (images.length === 0) {
    return (
      <div className="vr-empty-state">
        <div className="vr-empty-icon">
          <ImageIcon size={48} />
        </div>
        <h3>No Visual Regression Data</h3>
        <p>Run a visual regression test to capture screenshots for comparison.</p>
      </div>
    )
  }

  const currentImage = images[currentImageIndex]
  const currentImageUrl = currentImage?.[currentView]

  return (
    <div className="vr-gallery">
      {/* Baseline Run Notice */}
      {visualData?.is_baseline_run && (
        <div className="vr-baseline-notice">
          <div className="vr-baseline-icon">
            <Camera size={24} />
          </div>
          <div className="vr-baseline-content">
            <h4>Baseline Captured</h4>
            <p>
              Screenshots have been saved as the baseline. Run this test again to compare
              future changes against these images.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="vr-stats-grid">
        <div className="vr-stat-card">
          <div className="vr-stat-icon">
            <Layers size={20} />
          </div>
          <div className="vr-stat-value">{stats.total}</div>
          <div className="vr-stat-label">Screenshots</div>
        </div>
        <div className="vr-stat-card success">
          <div className="vr-stat-icon">
            <CheckCircle size={20} />
          </div>
          <div className="vr-stat-value">{stats.passed}</div>
          <div className="vr-stat-label">Passed</div>
        </div>
        <div className="vr-stat-card danger">
          <div className="vr-stat-icon">
            <XCircle size={20} />
          </div>
          <div className="vr-stat-value">{stats.failed}</div>
          <div className="vr-stat-label">Failed</div>
        </div>
        <div className="vr-stat-card info">
          <div className="vr-stat-icon">
            <Eye size={20} />
          </div>
          <div className="vr-stat-value">{stats.avgSimilarity}%</div>
          <div className="vr-stat-label">Avg Match</div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="vr-comparisons">
        {images.map((image, index) => (
          <div key={image.id} className={`vr-comparison-card ${image.status}`}>
            {/* Card Header */}
            <div className="vr-card-header">
              <div className="vr-card-title">
                <span className="vr-viewport-icon">{getViewportIcon(image.width)}</span>
                <div>
                  <h4>{image.name}</h4>
                  <span className="vr-viewport-size">{image.viewport}</span>
                </div>
              </div>
              <div className="vr-card-status">
                {/* Compare Toggle Button - only show for non-baseline runs with both images */}
                {!image.isBaselineRun && image.baseline && image.current && (
                  <button
                    className={`vr-compare-toggle ${comparisonModeCards.has(image.id) ? 'active' : ''}`}
                    onClick={() => toggleComparisonMode(image.id)}
                    title={comparisonModeCards.has(image.id) ? 'Switch to Grid View' : 'Switch to Slider Compare'}
                  >
                    <SplitSquareVertical size={16} />
                    {comparisonModeCards.has(image.id) ? 'Grid' : 'Compare'}
                  </button>
                )}
                <span className={`vr-status-badge ${image.status}`}>
                  {image.status === 'pass' ? (
                    <><CheckCircle size={14} /> Match</>
                  ) : (
                    <><XCircle size={14} /> Changed</>
                  )}
                </span>
                <span className="vr-similarity">{image.similarity.toFixed(1)}%</span>
              </div>
            </div>

            {/* Image Content - Grid or Comparison Slider */}
            {comparisonModeCards.has(image.id) && !image.isBaselineRun && image.baseline && image.current ? (
              // Comparison Slider Mode
              <div className="vr-compare-slider-container">
                <BeforeAfterSlider
                  beforeUrl={image.baseline}
                  afterUrl={image.current}
                  label={image.name}
                />
                <p className="vr-compare-hint">
                  <SplitSquareVertical size={14} />
                  Drag the slider to compare baseline vs current
                </p>
              </div>
            ) : (
              // Grid Mode
              <div className={`vr-image-grid ${image.isBaselineRun ? 'single' : 'triple'}`}>
                {image.isBaselineRun ? (
                  // Baseline run - show only current screenshot
                  <ImageCard
                    url={image.current}
                    label="Baseline Screenshot"
                    hasError={imageErrors[`${image.id}-current`]}
                    onError={() => handleImageError(image.id, 'current')}
                    onClick={() => openLightbox(index, 'current')}
                    onDownload={() => handleDownload(image.current, `${image.name}-baseline.png`)}
                  />
                ) : (
                  // Comparison run - show all three
                  <>
                    {image.baseline && (
                      <ImageCard
                        url={image.baseline}
                        label="Baseline"
                        hasError={imageErrors[`${image.id}-baseline`]}
                        onError={() => handleImageError(image.id, 'baseline')}
                        onClick={() => openLightbox(index, 'baseline')}
                        onDownload={() => handleDownload(image.baseline, `${image.name}-baseline.png`)}
                      />
                    )}
                    <ImageCard
                      url={image.current}
                      label="Current"
                      hasError={imageErrors[`${image.id}-current`]}
                      onError={() => handleImageError(image.id, 'current')}
                      onClick={() => openLightbox(index, 'current')}
                      onDownload={() => handleDownload(image.current, `${image.name}-current.png`)}
                    />
                    {image.diff && (
                      <ImageCard
                        url={image.diff}
                        label="Difference"
                        highlight={image.status === 'fail'}
                        hasError={imageErrors[`${image.id}-diff`]}
                        onError={() => handleImageError(image.id, 'diff')}
                        onClick={() => openLightbox(index, 'diff')}
                        onDownload={() => handleDownload(image.diff, `${image.name}-diff.png`)}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Card Footer Stats */}
            {!image.isBaselineRun && image.pixelsChanged > 0 && (
              <div className="vr-card-footer">
                <span className="vr-pixel-info">
                  <AlertCircle size={14} />
                  {image.pixelsChanged.toLocaleString()} pixels changed ({image.differencePercentage.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div className="vr-lightbox" onClick={closeLightbox}>
          {/* Close Button */}
          <button className="vr-lightbox-close" onClick={closeLightbox}>
            <X size={24} />
          </button>

          {/* View Selector */}
          <div className="vr-lightbox-tabs">
            {!currentImage.isBaselineRun && currentImage.baseline && (
              <button
                className={`vr-tab ${currentView === 'baseline' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentView('baseline'); }}
              >
                Baseline
              </button>
            )}
            <button
              className={`vr-tab ${currentView === 'current' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setCurrentView('current'); }}
            >
              {currentImage.isBaselineRun ? 'Screenshot' : 'Current'}
            </button>
            {!currentImage.isBaselineRun && currentImage.diff && (
              <button
                className={`vr-tab ${currentView === 'diff' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentView('diff'); }}
              >
                Difference
              </button>
            )}
          </div>

          {/* Download Button */}
          <button
            className="vr-lightbox-download"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload(currentImageUrl, `${currentImage.name}-${currentView}.png`)
            }}
          >
            <Download size={20} />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                className="vr-lightbox-nav prev"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                className="vr-lightbox-nav next"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Image Display */}
          <div className="vr-lightbox-content" onClick={(e) => e.stopPropagation()}>
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={`${currentImage.name} - ${currentView}`}
                className="vr-lightbox-image"
              />
            ) : (
              <div className="vr-lightbox-error">
                <ImageIcon size={48} />
                <p>Image not available</p>
              </div>
            )}
          </div>

          {/* Image Info */}
          <div className="vr-lightbox-info">
            <span className="vr-lightbox-name">{currentImage.name}</span>
            <span className="vr-lightbox-counter">{currentImageIndex + 1} / {images.length}</span>
          </div>
        </div>
      )}

      <style>{`
        .vr-gallery {
          padding: 0;
        }

        /* Empty State */
        .vr-empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .vr-empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }

        .vr-empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px;
        }

        .vr-empty-state p {
          font-size: 14px;
          margin: 0;
        }

        /* Baseline Notice */
        .vr-baseline-notice {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .vr-baseline-icon {
          width: 48px;
          height: 48px;
          background: #10b981;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .vr-baseline-content h4 {
          font-size: 15px;
          font-weight: 700;
          color: #065f46;
          margin: 0 0 4px;
        }

        .vr-baseline-content p {
          font-size: 13px;
          color: #047857;
          margin: 0;
          line-height: 1.5;
        }

        /* Stats Grid */
        .vr-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .vr-stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s;
        }

        .vr-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .vr-stat-icon {
          width: 36px;
          height: 36px;
          margin: 0 auto 8px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .vr-stat-card.success .vr-stat-icon {
          background: #ecfdf5;
          color: #10b981;
        }

        .vr-stat-card.danger .vr-stat-icon {
          background: #fef2f2;
          color: #ef4444;
        }

        .vr-stat-card.info .vr-stat-icon {
          background: #eff6ff;
          color: #3b82f6;
        }

        .vr-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .vr-stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          font-weight: 500;
        }

        /* Comparison Cards */
        .vr-comparisons {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .vr-comparison-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .vr-comparison-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .vr-comparison-card.pass {
          border-left: 4px solid #10b981;
        }

        .vr-comparison-card.fail {
          border-left: 4px solid #ef4444;
        }

        /* Card Header */
        .vr-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .vr-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vr-viewport-icon {
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .vr-card-title h4 {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .vr-viewport-size {
          font-size: 12px;
          color: #6b7280;
        }

        .vr-card-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vr-compare-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .vr-compare-toggle:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .vr-compare-toggle.active {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        }

        .vr-compare-slider-container {
          padding: 20px;
        }

        .vr-compare-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 12px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .vr-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .vr-status-badge.pass {
          background: #ecfdf5;
          color: #059669;
        }

        .vr-status-badge.fail {
          background: #fef2f2;
          color: #dc2626;
        }

        .vr-similarity {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }

        /* Image Grid */
        .vr-image-grid {
          display: grid;
          gap: 16px;
          padding: 20px;
        }

        .vr-image-grid.single {
          grid-template-columns: 1fr;
          max-width: 600px;
          margin: 0 auto;
        }

        .vr-image-grid.triple {
          grid-template-columns: repeat(3, 1fr);
        }

        /* Card Footer */
        .vr-card-footer {
          padding: 12px 20px;
          background: #fef2f2;
          border-top: 1px solid #fecaca;
        }

        .vr-pixel-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #dc2626;
          font-weight: 500;
        }

        /* Lightbox */
        .vr-lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vr-lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 44px;
          height: 44px;
          border: none;
          background: white;
          border-radius: 50%;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .vr-lightbox-close:hover {
          background: #f3f4f6;
          transform: scale(1.05);
        }

        .vr-lightbox-tabs {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px;
          border-radius: 10px;
          z-index: 10;
        }

        .vr-tab {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: white;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vr-tab:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .vr-tab.active {
          background: white;
          color: #111827;
        }

        .vr-lightbox-download {
          position: absolute;
          top: 20px;
          right: 80px;
          width: 44px;
          height: 44px;
          border: none;
          background: white;
          border-radius: 50%;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .vr-lightbox-download:hover {
          background: #f3f4f6;
          transform: scale(1.05);
        }

        .vr-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 56px;
          height: 56px;
          border: none;
          background: white;
          border-radius: 50%;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .vr-lightbox-nav.prev {
          left: 20px;
        }

        .vr-lightbox-nav.next {
          right: 20px;
        }

        .vr-lightbox-nav:hover {
          background: #f3f4f6;
          transform: translateY(-50%) scale(1.05);
        }

        .vr-lightbox-content {
          max-width: 90vw;
          max-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vr-lightbox-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 8px;
        }

        .vr-lightbox-error {
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }

        .vr-lightbox-error svg {
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .vr-lightbox-info {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: white;
          border-radius: 10px;
          z-index: 10;
        }

        .vr-lightbox-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .vr-lightbox-counter {
          font-size: 13px;
          color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .vr-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .vr-image-grid.triple {
            grid-template-columns: 1fr;
          }

          .vr-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .vr-lightbox-tabs {
            top: 80px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .vr-lightbox-nav {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </div>
  )
}

// Helper component for image thumbnails
function ImageCard({ url, label, highlight = false, hasError = false, onError, onClick, onDownload }) {
  if (!url) return null

  return (
    <div
      className={`vr-image-card ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
    >
      <div className="vr-image-label">
        <span>{label}</span>
        <div className="vr-image-actions">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            title="Download"
          >
            <Download size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClick(); }} title="View">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
      <div className="vr-image-container">
        {hasError ? (
          <div className="vr-image-error">
            <AlertCircle size={24} />
            <span>Failed to load</span>
          </div>
        ) : (
          <img
            src={url}
            alt={label}
            onError={onError}
            loading="lazy"
          />
        )}
      </div>
      <div className="vr-image-overlay">
        <ZoomIn size={24} />
      </div>

      <style>{`
        .vr-image-card {
          position: relative;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vr-image-card:hover {
          border-color: #10b981;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
        }

        .vr-image-card.highlight {
          border-color: #ef4444;
        }

        .vr-image-card.highlight:hover {
          border-color: #dc2626;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.15);
        }

        .vr-image-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #111827;
          color: white;
        }

        .vr-image-label span {
          font-size: 13px;
          font-weight: 600;
        }

        .vr-image-card.highlight .vr-image-label {
          background: #dc2626;
        }

        .vr-image-actions {
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .vr-image-card:hover .vr-image-actions {
          opacity: 1;
        }

        .vr-image-actions button {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .vr-image-actions button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .vr-image-container {
          aspect-ratio: 16/10;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vr-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vr-image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 12px;
        }

        .vr-image-overlay {
          position: absolute;
          inset: 0;
          top: 44px;
          background: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: all 0.2s;
        }

        .vr-image-card:hover .vr-image-overlay {
          background: rgba(0, 0, 0, 0.4);
          opacity: 1;
        }
      `}</style>
    </div>
  )
}

export default VisualRegressionGallery
