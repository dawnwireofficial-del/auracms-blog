"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type TrackItem = {
  date: string;
  time: string;
  description: string;
  location: string;
};

type RoadMapItem = {
  title: string;
  time: string;
  active: boolean;
};

type Props = {
  product: {
    name: string;
    image: string;
    orderId: string;
    brand: string;
    placedDate: string;
    quantity: number;
  };
  roadMap: RoadMapItem[];
  history: TrackItem[];
};

const OrderTracking: React.FC<Props> = ({ product, roadMap, history }) => {
  return (
    <>
      {/* ORDER TRACK */}
      <div className="wg-box mb-20">
        <div className="order-track">
          <div className="image">
            <Image width={362} height={362} src={product.image} alt="image" />
          </div>

          <div className="content">
            <div className="h5 mb-20">{product.name}</div>

            <div className="infor mb-10">
              <div className="body-text">Order ID</div>
              <div className="body-title-2">{product.orderId}</div>
            </div>

            <div className="infor mb-10">
              <div className="body-text">Brand:</div>
              <div className="body-title-2">{product.brand}</div>
            </div>

            <div className="infor mb-10">
              <div className="body-text">Order Placed:</div>
              <div className="body-title-2">{product.placedDate}</div>
            </div>

            <div className="infor mb-20">
              <div className="body-text">Quantity:</div>
              <div className="body-title-2">{product.quantity}</div>
            </div>

            <div className="flex gap10 flex-wrap">
              <Link className="tf-button style-1 w230" href={"/all-product"}>
                View shop
              </Link>
              <Link className="tf-button w230" href={"/product-detail/1"}>
                View product
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL */}
      <div className="wg-box mb-20">
        <div>
          <div className="h6 mb-10">Detail</div>
          <div className="body-text">
            Your items is on the way. Tracking information will be available
            within 24 hours.
          </div>
        </div>

        <div className="road-map">
          {roadMap.map((item, index) => (
            <div
              key={index}
              className={`road-map-item ${item.active ? "active" : ""}`}
            >
              <div className="icon">
                <i className="icon-check"></i>
              </div>
              <div className="h6">{item.title}</div>
              <div className="body-text">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="wg-box">
        <div className="wg-table table-order-track">
          <ul className="table-title bg-dark-1 flex mb-24 gap20">
            <li>
              <div className="body-title">Date</div>
            </li>
            <li>
              <div className="body-title">Time</div>
            </li>
            <li>
              <div className="body-title">Description</div>
            </li>
            <li>
              <div className="body-title">Location</div>
            </li>
          </ul>

          <ul className="flex flex-column gap14">
            {history.map((item, index) => (
              <React.Fragment key={index}>
                <li className="cart-totals-item">
                  <div className="body-text">{item.date}</div>
                  <div className="body-text">{item.time}</div>
                  <div className="body-text">{item.description}</div>
                  <div className="body-text">{item.location}</div>
                </li>
                <li className="divider"></li>
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default OrderTracking;