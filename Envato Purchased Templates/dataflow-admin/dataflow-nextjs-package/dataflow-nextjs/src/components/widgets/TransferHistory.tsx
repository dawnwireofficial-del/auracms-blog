"use client";

import React, { useState } from "react";
import ConfirmModal from "@/components/common/ConfirmModal";

type TransferItem = {
  id: string;
  name: string;
  date: string;
  total: string;
};

type Props = {
  data: TransferItem[];
};

const TransferHistory: React.FC<Props> = ({ data }) => {
  const [list, setList] = useState<TransferItem[]>(data);
  const [selectedItem, setSelectedItem] = useState<TransferItem | null>(null);

  const handleDeleteClick = (item: TransferItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedItem) return;

    setList((prev) => prev.filter((item) => item.id !== selectedItem.id));
    setSelectedItem(null);
  };

  return (
    <>
      <div className="wg-box">
        <h5>Transfer History</h5>

        <div className="wg-table table-transfer-history">
          <ul className="table-title flex gap20 mb-14">
            <li><div className="body-title">Transfer Id</div></li>
            <li><div className="body-title">Name</div></li>
            <li><div className="body-title">Date</div></li>
            <li><div className="body-title">Total</div></li>
            <li><div className="body-title">Action</div></li>
          </ul>

          <ul className="flex flex-column">
            {list.map((item) => (
              <li
                key={item.id}
                className="attribute-item item-row flex items-center justify-between gap20"
              >
                <div className="body-text">{item.id}</div>
                <div className="body-text">{item.name}</div>
                <div className="body-text">{item.date}</div>
                <div className="body-text">{item.total}</div>

                <div className="list-icon-function">
                  <div className="item eye">
                    <i className="icon-eye"></i>
                  </div>

                  <div className="item edit">
                    <i className="icon-edit-3"></i>
                  </div>

                  <div
                    className="item trash"
                    onClick={() => handleDeleteClick(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="icon-trash-2"></i>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ConfirmModal
        open={!!selectedItem}
        title="Confirm delete"
        message={
          selectedItem ? (
            <>
              Are you sure you want to delete transfer{" "}
              <strong>{selectedItem.id}</strong> - {selectedItem.name}?
            </>
          ) : null
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
      />
    </>
  );
};

export default TransferHistory;