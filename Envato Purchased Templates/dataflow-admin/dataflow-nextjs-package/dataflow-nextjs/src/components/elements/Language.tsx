'use client'

import { Listbox } from '@headlessui/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'

import ENG from "../../../public/images/country/1.png"
import FRA from "../../../public/images/country/5.png"
import DEU from "../../../public/images/country/7.png"
import VIE from "../../../public/images/country/9.png"

const options = [
    { label: "ENG", img: ENG },
    { label: "FRA", img: FRA },
    { label: "DEU", img: DEU },
    { label: "VIE", img: VIE },
] as const;

type LangOption = (typeof options)[number];

export default function CustomSelect() {
    const [selected, setSelected] = useState<LangOption | null>(null)

    useEffect(() => {
        // Ensures hydration match by only showing UI after mount
        setSelected(options[0])
    }, [])

    if (!selected) return null

    return (
        <div className="image-select">
            <Listbox value={selected} onChange={setSelected}>
                <Listbox.Button className="select-button">
                    {/* add suppression to avoid hydration mismatches */}
                    <Image src={selected.img} alt={selected.label} width={20} height={20} priority />
                </Listbox.Button>

                <Listbox.Options className="dropdown-menu show">
                    <div className='inner show'>
                        {options.map((option, index) => (
                            <Listbox.Option key={option.label} value={option} className="select-option">
                                <Image src={option.img} alt={option.label} width={20} height={20} priority />
                                <span>{option.label}</span>
                            </Listbox.Option>
                        ))}
                    </div>
                </Listbox.Options>
            </Listbox>
        </div>
    )
}