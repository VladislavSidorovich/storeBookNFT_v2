"use client";
import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import "swiper/css";
import { Titles, useTitlesData } from "../methods/blockchain/readContract";
import { getAddressNFTdataCounters } from "../methods/blockchain/readContractCore";
import {
  setProducts,
  setCompletedIds,
  setAllProductsToNotCompleted,
  open,
  openBookIframe,
  openPreviewIframe,
} from "../store/features/orderSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useAccount } from "wagmi";
import {
  filterMultipleTitleCountersResult,
  filterTitleResult,
} from "../utils/converter";
import Lottie from "lottie-react";
import animation from "../static/lottie/loadingAnimation.json";
import cn from "classnames";
import { formatUnits } from "viem";
import { fetchIPFSData } from "../methods/api/fetchIPSF";

interface BlockchainData {
  error?: undefined;
  result: any;
  status: "success";
  id?: number;
}

interface StaticData {
  id: number;
  name: string;
  price: string;
  supplyRemain: number;
  previewText: string;
  actionText: string;
  authorInfo: string;
  uri: string,
  caption: string;
}

type CombinedData = BlockchainData | StaticData;

function Index() {
  const [contentMap, setContentMap] = useState<Record<number, any>>({}); // Храним состояние для каждого элемента
  const [searchQuery, setSearchQuery] = useState(""); // Состояние для поиска
  const { data: titlesData, status } = useTitlesData();
  const dispatch = useAppDispatch();

  // Пример статических данных
  const staticData: StaticData[] = [
    {
      id: 10,
      name: "Превращения",
      price: "",
      supplyRemain: 10,
      uri: "",
      authorInfo: "Гермес",
      previewText: "Превью статьи 3",
      actionText: "Читать статью 3",
      caption: "текст",
    },
    {
      id: 11,
      name: "Из послесловия к немецкому изданию «Истории древней философии», 1899 г.",
      price: "",
      supplyRemain: 10,
      uri: "",
      authorInfo: "Вильгельм Виндельбанд",
      previewText: "Превью статьи 3",
      actionText: "Читать статью 3",
      caption: "текст",
    },
    {
      id: 12,
      name: "Отрывок из выступления на семинаре в Национальном центре научных исследований (стенограмма). Париж, 2000г.",
      price: "",
      supplyRemain: 10,
      uri: "",
      authorInfo: "Франсиско Варела",
      previewText: "Превью статьи 3",
      actionText: "Читать статью 3",
      caption: "текст",
    },
  ];

  // Объединяем данные
const combinedData: CombinedData[] = useMemo(() => {
  const successfulBlockchainData =
    titlesData?.filter(
      (data): data is BlockchainData =>
        "result" in data && data.status === "success"
    ) || [];

  // Реверсируем данные и добавляем id каждому элементу
  return [...successfulBlockchainData.reverse(), ...staticData].map((item, index) => ({
    ...item, // Сохраняем все существующие свойства элемента
    id: index + 1, // Добавляем уникальный id (начиная с 1)
  }));
}, [titlesData, staticData]);

// Загружаем контент для каждого элемента
useEffect(() => {
  const loadContent = async () => {
    const newContentMap: Record<number, any> = { ...contentMap };

    try {
      // Используем Promise.all для параллельной загрузки данных
      const dataPromises = combinedData
        .filter((el) => {
          const uri = "result" in el ? el.result.uri : el.uri;

          // Пропускаем, если URI пустой
          return uri;
        })
        .map(async (el) => {
          const id = el.id; // id уже установлен в combinedData
          const uri = "result" in el ? el.result.uri : el.uri;

          try {
            const data = await fetchIPFSData(uri);
            return { id, data }; // Возвращаем id и данные
          } catch (error) {
            console.error(`Ошибка загрузки данных для id ${id}`, error);
            return { id, data: undefined }; // Возвращаем undefined в случае ошибки
          }
        });

      // Ждем, пока все промисы завершатся
      const results = await Promise.all(dataPromises);

      // Обновляем newContentMap с загруженными данными
      results.forEach(({ id, data }) => {
        if (id !== undefined) {
          newContentMap[id] = data;
        }
      });


      // Обновляем состояние только если есть изменения
      if (JSON.stringify(newContentMap) !== JSON.stringify(contentMap)) {
        setContentMap(newContentMap);
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    }
  };

  loadContent();
}, [combinedData]); // Следим только за combinedData

const enrichedData = useMemo(() => {
  // Собираем данные из contentMap
  const contentMapData = Object.entries(contentMap).map(([id, data]) => ({
    id: Number(id), // id из contentMap
    name: data?.name || "",
    author: data?.author || "",
    authorInfo: data?.authorInfo || "",
    date: data?.date || "", // Дата из данных IPFS (или пустая строка, если данных нет)
    preview: data?.preview || "",
  }));

  // Собираем данные из staticData
  const staticDataEntries = staticData.map((item) => ({
    id: item.id, // id из staticData
    name: item.name || "", // Имя из staticData (или пустая строка, если данных нет)
    authorInfo: item.authorInfo || "", 
    caption: item.caption || "", // Имя из staticData (или пустая строка, если данных нет)
  }));

  // Добавляем поля price и supplyRemain из combinedData в contentMapData по совпадающему id
  const updatedContentMapData = contentMapData.map((contentItem) => {
    const matchingCombinedItem = combinedData.find(
      (combinedItem) => combinedItem.id === contentItem.id
    );

    if (matchingCombinedItem) {
      const price =
        "result" in matchingCombinedItem
          ? matchingCombinedItem.result?.price
          : matchingCombinedItem.price;
      const supplyRemain =
        "result" in matchingCombinedItem
          ? matchingCombinedItem.result?.supplyRemain
          : matchingCombinedItem.supplyRemain;

      return {
        ...contentItem,
        price: price || null, // Добавляем price, если оно есть
        supplyRemain: supplyRemain || null, // Добавляем supplyRemain, если оно есть
      };
    }

    // Если совпадение не найдено, возвращаем элемент без изменений
    return {
      ...contentItem,
      price: null,
      supplyRemain: null,
      uri: null,
    };
  });

  // Добавляем новую переменную id_revers
  const enrichedContentMapData = updatedContentMapData.map((item, index, array) => ({
    ...item,
    id_revers: array.length - index, // Добавляем id_revers (идёт от общего количества к 1)
  }));

  // Объединяем массивы (обновленный enrichedContentMapData + staticDataEntries)
  return [...enrichedContentMapData, ...staticDataEntries];
}, [contentMap, staticData, combinedData]);


// Фильтрация данных по поисковому запросу
const filteredData = useMemo(() => {
  if (!searchQuery) return enrichedData;

  return enrichedData.filter((el) =>
    el.name.toLowerCase().includes(searchQuery.toLowerCase()) // Сравнение имени с поисковым запросом
  );
}, [searchQuery, enrichedData]);

// Вывод в консоль для проверки
useEffect(() => {
  console.log("Enriched Data:", enrichedData);
  console.log("Filtered Data:", filteredData);
}, [enrichedData, filteredData]);

  const { products } = useAppSelector((state) => state.order);
  const product = products.find((el) => el.id);

  return (
    <div>
      {/* Поле ввода для поиска */}
      <input
        type="text"
        placeholder="Введите для поиска..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />

      {/* Проверяем наличие текста в поле ввода */}
      {searchQuery.trim() && (
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          breakpoints={{
            800: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            1100: {
              slidesPerView: 3,
              spaceBetween: 10,
            },
          }}
          navigation
          pagination={{ clickable: true }}
          className="custom-swiper"
        >
          {/* Проверяем статус загрузки */}
          {status === "success" ? (
            filteredData
            .filter((el) => el.id !== 2 && el.id !== 9) // Исключаем элементы с id 5 и 10
            .map((el) => {
              const id = el.id;
          
              let id_revers = 0;
          
              if ("id_revers" in el) {
                id_revers = el.id_revers;
              }
          
              // Проверяем наличие данных (el)
              if (!el) {
                return <div key={id}>Загрузка данных для id {id}...</div>;
              }

              // Проверяем наличие данных (el)
              if (!el) {
                return <div key={id}>Загрузка данных для id {id}...</div>;
              }

              const excludedIds = [5, 10, 15]; // Список нежелательных id

              

              return (
                <SwiperSlide key={id}>
                  <div className="nft nft_search">
                    {/* Заголовок NFT */}
                    <h3 className="nft__heading">{el?.name || "Без имени"}</h3>
                    {"authorInfo" in el ? (
                      <p className="nft__heading">
                        {el?.authorInfo || "Информация об авторе недоступна"}
                      </p>
                    ) : (
                      <p className="nft__price"></p>
                    )}

                    {/* Стоимость NFT */}
                    {"caption" in el ? (
                      <p className="nft__caption nft_static_text">{el.caption}</p>
                    ) : (
                      <p className="nft__caption">Стоимость:</p>
                    )}

                    {"price" in el ? (
                      <div>
                        <p className="nft__price">
                          {el.price
                            ? `${formatUnits(el.price, 18)} MATIC`
                            : "Цена не указана"}
                        </p>
                        <p className="nft__caption">(Около 300 рублей РФ)</p>
                        <br />
                      </div>
                    ) : (
                      <p className="nft__price"></p>
                    )}

                    {/* Оставшееся количество */}
                    {"supplyRemain" in el ? (
                      <div>
                        <p className="nft__caption">
                          Оставшееся количество:{" "}
                          {el?.supplyRemain !== null ? Number(el.supplyRemain) : "Неизвестно"}
                        </p>
                        <br />
                      </div>
                    ) : (
                      <p className="nft__price"></p>
                    )}

                    {/* Дата выпуска */}
                    {"date" in el ? (
                      <p className="nft__time">
                        {el?.date || "Дата неизвестна"}
                      </p>
                    ) : (
                      <p className="nft__price"></p>
                    )}

                    {/* Кнопки */}
                    {"preview" in el ? (
                      <button
                        onClick={() => dispatch(openPreviewIframe(id_revers))}
                        className={cn("btn", "btn_1", {
                          active: product?.isCompleted,
                        })}
                      >
                        Превью статьи
                      </button>
                    ) : (
                      <p className="nft__price"></p>
                    )}
                    {product?.isCompleted && (
                      <button
                        onClick={() => dispatch(openBookIframe(id_revers))}
                        className={cn("btn", "btn_3", {
                          active: product?.isCompleted,
                        })}
                      >
                        Читать статью
                      </button>
                    )}
                    {"preview" in el ? (
                      <button
                        onClick={() => dispatch(open(id_revers))}
                        className={cn("btn", "btn_2", {
                          active: false, // Здесь можно связать с состоянием
                        })}
                      >
                        Приобрести NFT
                      </button>
                    ) : (
                      <button
                        className={cn("btn", "btn_1", "btn_NotBlockchain", {
                          active: product?.isCompleted,
                        })}
                      >
                        Готовится к публикации
                      </button>
                    )}
                  </div>
                </SwiperSlide>
              );
            })
          ) : (
            <div className="loading-block">
              <Lottie
                animationData={animation}
                className={"loading-block-animation"}
              />
            </div>
          )}
        </Swiper>
      )}
    </div>
  );
}

export default Index;