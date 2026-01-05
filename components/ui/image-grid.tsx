"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageGridProps {
  images: string[]
}

export function ImageGrid({ images }: ImageGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!images || images.length === 0) return null

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const renderGrid = () => {
    const count = images.length

    if (count === 1) {
      return (
        <div
          className="relative w-full overflow-hidden rounded-lg cursor-pointer max-h-[500px]"
          onClick={() => openLightbox(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt="Post image"
            className="w-full h-full object-cover hover:opacity-95 transition-opacity"
          />
        </div>
      )
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-[300px] overflow-hidden rounded-lg">
          {images.map((img, idx) => (
            <div key={idx} className="relative h-full cursor-pointer" onClick={() => openLightbox(idx)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover hover:opacity-95 transition-opacity"
              />
            </div>
          ))}
        </div>
      )
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-[300px] overflow-hidden rounded-lg">
          <div className="relative h-full cursor-pointer" onClick={() => openLightbox(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt="Image 1"
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
          </div>
          <div className="grid grid-rows-2 gap-1 h-full">
            {images.slice(1).map((img, idx) => (
              <div key={idx + 1} className="relative h-full cursor-pointer" onClick={() => openLightbox(idx + 1)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Image ${idx + 2}`}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // 4 or more
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-[400px] overflow-hidden rounded-lg">
        {images.slice(0, 3).map((img, idx) => (
          <div
            key={idx}
            className={`relative cursor-pointer ${idx === 0 ? "col-span-2 h-[60%]" : "h-[40%]"}`}
            onClick={() => openLightbox(idx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`Image ${idx + 1}`}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
          </div>
        ))}
        <div className="relative h-[40%] cursor-pointer" onClick={() => openLightbox(3)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[3]}
            alt="Image 4"
            className="w-full h-full object-cover hover:opacity-95 transition-opacity"
          />
          {count > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold hover:bg-black/60 transition-colors">
              +{count - 4}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mt-2">{renderGrid()}</div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="!max-w-none w-screen h-screen p-0 bg-black/95 border-none shadow-none flex flex-col items-center justify-center overflow-hidden z-[100] focus:outline-none">
          <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
          {/* Close Button */}
          <DialogClose className="absolute top-4 right-4 z-[110] p-2 bg-black/50 text-white/80 hover:text-white rounded-full backdrop-blur-sm transition-colors cursor-pointer outline-none">
            <X className="h-6 w-6" />
          </DialogClose>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200"
            />
          </div>

          {/* Download Button */}
          <a
            href={images[currentImageIndex].replace("/upload/", "/upload/fl_attachment/")}
            className="absolute bottom-8 right-8 z-[110] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/10"
            title="Tải về"
            download
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-6 w-6" />
          </a>
        </DialogContent>
      </Dialog>
    </>
  )
}
