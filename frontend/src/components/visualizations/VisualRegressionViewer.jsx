import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Image as ImageIcon,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * VisualRegressionViewer - Component to display visual regression test results
 *
 * Features:
 * - Side-by-side image comparison (Baseline, Current, Diff)
 * - Tab-based view switching
 * - Zoom controls
 * - Full-screen modal
 * - Download images
 * - Comparison list with pass/fail indicators
 *
 * @param {Object} visualData - Visual regression data with comparison images
 * @param {Array} comparisons - Array of comparison objects
 */
export function VisualRegressionViewer({ visualData, comparisons = [] }) {
  const [selectedView, setSelectedView] = useState('side-by-side')
  const [zoom, setZoom] = useState(100)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  if (!visualData && (!comparisons || comparisons.length === 0)) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No visual regression data available</p>
      </div>
    )
  }

  // Parse comparisons if needed
  const comparisonList = typeof comparisons === 'string'
    ? JSON.parse(comparisons)
    : comparisons

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200))
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50))
  const handleResetZoom = () => setZoom(100)

  const handleDownload = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {visualData && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {comparisonList.length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Comparisons</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {comparisonList.filter(c => c.status === 'pass').length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Passed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {comparisonList.filter(c => c.status === 'fail').length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Failed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {visualData.similarity_score ? `${(visualData.similarity_score * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Similarity</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Comparison Viewer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Image Comparison</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Reset Zoom"
              >
                <RotateCw size={18} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={setSelectedView}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
              <TabsTrigger value="baseline">Baseline</TabsTrigger>
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="diff">Difference</TabsTrigger>
            </TabsList>

            {/* Side-by-Side View */}
            <TabsContent value="side-by-side">
              <div className="grid grid-cols-3 gap-4">
                <ImageCard
                  title="Baseline"
                  url={visualData?.baseline_url}
                  zoom={zoom}
                  onFullscreen={setFullscreenImage}
                  onDownload={() => handleDownload(visualData?.baseline_url, 'baseline.png')}
                />
                <ImageCard
                  title="Current"
                  url={visualData?.current_url}
                  zoom={zoom}
                  onFullscreen={setFullscreenImage}
                  onDownload={() => handleDownload(visualData?.current_url, 'current.png')}
                />
                <ImageCard
                  title="Difference"
                  url={visualData?.diff_url}
                  zoom={zoom}
                  onFullscreen={setFullscreenImage}
                  onDownload={() => handleDownload(visualData?.diff_url, 'diff.png')}
                  highlight
                />
              </div>
            </TabsContent>

            {/* Individual Views */}
            <TabsContent value="baseline">
              <ImageCard
                title="Baseline Image"
                url={visualData?.baseline_url}
                zoom={zoom}
                onFullscreen={setFullscreenImage}
                onDownload={() => handleDownload(visualData?.baseline_url, 'baseline.png')}
                fullWidth
              />
            </TabsContent>

            <TabsContent value="current">
              <ImageCard
                title="Current Image"
                url={visualData?.current_url}
                zoom={zoom}
                onFullscreen={setFullscreenImage}
                onDownload={() => handleDownload(visualData?.current_url, 'current.png')}
                fullWidth
              />
            </TabsContent>

            <TabsContent value="diff">
              <ImageCard
                title="Difference Image"
                url={visualData?.diff_url}
                zoom={zoom}
                onFullscreen={setFullscreenImage}
                onDownload={() => handleDownload(visualData?.diff_url, 'diff.png')}
                fullWidth
                highlight
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Comparison List */}
      {comparisonList && comparisonList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Detailed Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comparisonList.map((comparison, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <ImageIcon size={18} className="text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {comparison.name || `Comparison ${index + 1}`}
                      </span>
                    </div>
                    <Badge
                      variant={comparison.status === 'pass' ? 'default' : 'destructive'}
                      className={cn(
                        comparison.status === 'pass'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                      )}
                    >
                      {comparison.status === 'pass' ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>

                  {comparison.viewport && (
                    <div className="text-sm text-gray-600 mb-2">
                      Viewport: {comparison.viewport}
                    </div>
                  )}

                  {comparison.similarity !== undefined && (
                    <div className="text-sm text-gray-600">
                      Similarity: {(comparison.similarity * 100).toFixed(2)}%
                    </div>
                  )}

                  {comparison.differences && (
                    <div className="text-sm text-red-600 mt-2">
                      {comparison.differences} pixel differences detected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-8"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// Helper component for image cards
function ImageCard({
  title,
  url,
  zoom = 100,
  onFullscreen,
  onDownload,
  fullWidth = false,
  highlight = false
}) {
  if (!url) {
    return (
      <div className={cn(
        'border-2 border-dashed border-gray-300 rounded-lg p-8',
        fullWidth ? 'w-full' : ''
      )}>
        <div className="text-center text-gray-400">
          <ImageIcon size={48} className="mx-auto mb-2" />
          <p className="text-sm">No image available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'border-2 rounded-lg overflow-hidden',
      highlight ? 'border-red-500' : 'border-gray-200',
      fullWidth ? 'w-full' : ''
    )}>
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b-2 border-gray-200">
        <span className="font-medium text-sm text-gray-700">{title}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onFullscreen(url)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={onDownload}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="bg-white p-4 overflow-auto max-h-[500px]">
        <img
          src={url}
          alt={title}
          style={{
            width: `${zoom}%`,
            height: 'auto',
            maxWidth: 'none'
          }}
          className="mx-auto"
        />
      </div>
    </div>
  )
}

export default VisualRegressionViewer
