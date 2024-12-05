import { motion } from "framer-motion";
import styles from "./imageBox.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import svg from "../../static/svg/svg";
import Lottie from "lottie-react";
import animation from "../../static/lottie/loadingAnimation.json";

interface ImageBoxProps {
  url: string;
  alt: string;
  width: number;
  height: number;
  onClose: () => void;
}

const ImageBox = ({ url, alt, width, height, onClose }: ImageBoxProps) => {
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0 }}
      className={styles.imageBox}
    >
      <div className={styles.imageBox__block} ref={imageBoxRef}>
        {!isImageLoading && (
          <Image
            src={svg.close}
            alt="close"
            onClick={onClose}
            className={styles["imageBox__block__close"]}
          />
        )}
        {isImageLoading && (
          <div className={styles["img_loading"]}>
            <Lottie animationData={animation} />
          </div>
        )}
        <Image
          src={url}
          alt={alt}
          width={width}
          height={height}
          className={styles["imageBox__block__image"]}
          onLoadingComplete={() => setIsImageLoading(false)}
        />
      </div>
    </motion.div>
  );
};

export default ImageBox;
