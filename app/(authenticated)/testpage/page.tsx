"use client";

import React from "react";
import Modal from "./Modal";


export default function Main() {

    // ---------------------------------------------
    // モーダル: 表示状態
    // ---------------------------------------------
    const [isOpenModal, setIsOpenModal] = React.useState(false);

    return (
        <div>
            {/* --- ボタン --- */}
            <button onClick={()=>setIsOpenModal(true)} className="p-4 text-white font-bold bg-blue-400 rounded-xl shadow-lg">
                モーダルを開く
            </button>

            {/* --- モーダル --- */}
            <Modal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
        </div>
    );
}