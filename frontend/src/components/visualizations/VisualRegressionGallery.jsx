import { useState } from 'react'
import { X, Download, ZoomIn, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * VisualRegressionGallery - Image gallery for visual regression test results
 *
 * Features:
 * - Grid layout of comparison images
 * - Lightbox with navigation
 * - Baseline, Current, and Diff views
 * - Zoom and download capabilities
 * - Responsive grid
 *
 * @param {Object} visualData - Visual regression data
 * @param {Array} comparisons - Array of comparison objects
 */
export function VisualRegressionGallery({ visualData, comparisons = [], baseUrl = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentView, setCurrentView] = useState('current') // baseline, current, diff

  // Helper to construct full image URL
  const getImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${baseUrl}/${path}`
  }

  // Build image list from visual data and comparisons
  const buildImageList = () => {
    const images = []

    // Parse comparisons if it's a JSON string
    const comparisonList = typeof comparisons === 'string'
      ? JSON.parse(comparisons)
      : comparisons

    if (!comparisonList || comparisonList.length === 0) {
      return images
    }

    // Process each comparison
    comparisonList.forEach((comparison, index) => {
      const isBaselineRun = comparison.is_baseline_run || visualData?.is_baseline_run

      images.push({
        id: `comparison-${index}`,
        name: comparison.viewport
          ? `${comparison.viewport.charAt(0).toUpperCase() + comparison.viewport.slice(1)} (${comparison.width}x${comparison.height})`
          : `Comparison ${index + 1}`,
        baseline: comparison.baseline_exists ? getImageUrl(comparison.baseline_path) : null,
        current: getImageUrl(comparison.screenshot_path),
        diff: comparison.difference_path ? getImageUrl(comparison.difference_path) : null,
        similarity: 1 - (comparison.difference_percentage / 100),
        status: comparison.passed ? 'pass' : 'fail',
        viewport: `${comparison.width}x${comparison.height}`,
        isBaselineRun: isBaselineRun,
        pixelsChanged: comparison.pixels_changed,
        totalPixels: comparison.total_pixels
      })
    })

    return images
  }

  const images = buildImageList()

  const openLightbox = (index, view = 'baseline') => {
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

  const handleDownload = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No visual regression images available</p>
        <p className="text-sm mt-2">Images will appear here after running a visual regression test</p>
      </div>
    )
  }

  const currentImage = images[currentImageIndex]
  const currentImageUrl = currentImage?.[currentView]

  return (
    <div className="space-y-6">
      {/* Baseline Run Notice */}
      {visualData?.is_baseline_run && (
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-blue-900">Baseline Run - Screenshots Captured</p>
              <p className="text-sm text-blue-700 mt-1">
                This is the first run. These screenshots will be used as the baseline for future comparisons.
                Run this test again to compare against these baseline images.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{images.length}</div>
          <div className="text-sm text-gray-600 mt-1">Screenshots</div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {images.filter(img => img.status === 'pass').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Passed</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">
            {images.filter(img => img.status === 'fail').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Failed</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {visualData?.overall_score || 100}
          </div>
          <div className="text-sm text-gray-600 mt-1">Score</div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="space-y-8">
        {images.map((image, index) => (
          <div key={image.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
            {/* Comparison Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{image.name}</h3>
                {image.viewport && (
                  <p className="text-sm text-gray-500 mt-1">Viewport: {image.viewport}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  image.status === 'pass'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}>
                  {image.status === 'pass' ? 'PASS' : 'FAIL'}
                </span>
                {image.similarity !== undefined && (
                  <span className="text-sm text-gray-600">
                    {(image.similarity * 100).toFixed(2)}% similar
                  </span>
                )}
              </div>
            </div>

            {/* Image Grid */}
            {image.isBaselineRun ? (
              // Baseline run - show only current screenshot
              <div className="grid grid-cols-1 gap-4">
                {image.current && (
                  <ImageThumbnail
                    url={image.current}
                    label="Baseline Screenshot"
                    onClick={() => openLightbox(index, 'current')}
                    onDownload={() => handleDownload(image.current, `${image.name}-baseline.png`)}
                  />
                )}
              </div>
            ) : (
              // Comparison run - show all three
              <div className="grid grid-cols-3 gap-4">
                {/* Baseline */}
                {image.baseline && (
                  <ImageThumbnail
                    url={image.baseline}
                    label="Baseline"
                    onClick={() => openLightbox(index, 'baseline')}
                    onDownload={() => handleDownload(image.baseline, `${image.name}-baseline.png`)}
                  />
                )}

                {/* Current */}
                {image.current && (
                  <ImageThumbnail
                    url={image.current}
                    label="Current"
                    onClick={() => openLightbox(index, 'current')}
                    onDownload={() => handleDownload(image.current, `${image.name}-current.png`)}
                  />
                )}

                {/* Diff */}
                {image.diff && (
                  <ImageThumbnail
                    url={image.diff}
                    label="Difference"
                    highlight={image.status === 'fail'}
                    onClick={() => openLightbox(index, 'diff')}
                    onDownload={() => handleDownload(image.diff, `${image.name}-diff.png`)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            onClick={closeLightbox}
          >
            <X size={24} className="text-gray-900" />
          </button>

          {/* View Selector */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                currentView === 'baseline'
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentView('baseline')
              }}
            >
              Baseline
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                currentView === 'current'
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentView('current')
              }}
            >
              Current
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                currentView === 'diff'
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentView('diff')
              }}
            >
              Difference
            </button>
          </div>

          {/* Download Button */}
          <button
            className="absolute top-4 right-20 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload(currentImageUrl, `${currentImage.name}-${currentView}.png`)
            }}
          >
            <Download size={24} className="text-gray-900" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
              >
                <ChevronLeft size={32} className="text-gray-900" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
              >
                <ChevronRight size={32} className="text-gray-900" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-lg">
            <span className="text-sm font-medium text-gray-900">
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>

          {/* Image Display */}
          {currentImageUrl && (
            <img
              src={currentImageUrl}
              alt={`${currentImage.name} - ${currentView}`}
              className="max-w-[90%] max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Image Info */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-lg">
            <span className="text-sm font-medium text-gray-900">
              {currentImage.name} - {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for image thumbnails
function ImageThumbnail({ url, label, highlight = false, onClick, onDownload }) {
  return (
    <div className={cn(
      'relative border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg group',
      highlight ? 'border-red-500' : 'border-gray-200 hover:border-blue-500'
    )}>
      {/* Label */}
      <div className={cn(
        'absolute top-0 left-0 right-0 px-3 py-2 flex items-center justify-between z-10',
        highlight ? 'bg-red-500' : 'bg-gray-900 bg-opacity-70'
      )}>
        <span className="text-sm font-semibold text-white">{label}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
            className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
            title="Download"
          >
            <Download size={14} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
            title="View Fullscreen"
          >
            <Maximize2 size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="aspect-video bg-gray-100 cursor-pointer"
        onClick={onClick}
      >
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Zoom overlay on hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100">
        <ZoomIn size={32} className="text-white" />
      </div>
    </div>
  )
}

export default VisualRegressionGallery
