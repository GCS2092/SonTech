import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Zoom } from 'swiper/modules';

export default function ProductImageSwiper({ images = [] }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  if (!images.length) return null;

  return (
    <div className="w-full flex flex-col gap-3">

      {/* Swiper principal */}
      <Swiper
        modules={[Navigation, Thumbs, Zoom]}
        thumbs={{ swiper: thumbsSwiper }}
        navigation
        zoom
        loop={images.length > 1}
        className="w-full rounded-xl overflow-hidden bg-gray-50"
        style={{ aspectRatio: '1 / 1' }}
      >
        {images.map((img, i) => (
          <SwiperSlide key={i}>
            <div className="swiper-zoom-container flex items-center justify-center h-full">
              <img
                src={img}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Swiper
          modules={[Thumbs]}
          onSwiper={setThumbsSwiper}
          slidesPerView={4}
          spaceBetween={8}
          watchSlidesProgress
          className="w-full"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i} className="cursor-pointer">
              <img
                src={img}
                alt={`Miniature ${i + 1}`}
                className="w-full aspect-square object-cover rounded-lg opacity-60 transition-opacity swiper-slide-thumb-active:opacity-100"
                loading="lazy"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}