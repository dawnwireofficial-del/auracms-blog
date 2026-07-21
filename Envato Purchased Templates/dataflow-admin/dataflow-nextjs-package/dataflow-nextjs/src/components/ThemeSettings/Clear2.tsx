
'use client'

import { useEffect } from 'react'

const Clearbtn2 = () => {
    useEffect(() => {
        const handleClearButtonClick = () => {
            const logoHeader = document.getElementById('logo_header') as HTMLElement | null;
            const tflight = logoHeader?.getAttribute('data-light') ?? '';

            const layoutWrap = document.querySelector('.layout-wrap') as HTMLElement | null;
            if (layoutWrap) {
                layoutWrap.setAttribute('data-colors-header', '');
                layoutWrap.setAttribute('data-colors-menu', '');
                layoutWrap.setAttribute('data-theme-primary', '');
                layoutWrap.setAttribute('data-theme-background', '');
                layoutWrap.setAttribute('data-image-menu-background', '');
            }

            // Remove 'active' class from all color elements except the default
            document.querySelectorAll('.select-colors-theme .active').forEach(element => {
                if (!element.classList.contains('default')) {
                    element.classList.remove('active');
                }
            });

            // Add 'active' class to the default select-colors-theme element
            const defaultElement = document.querySelector('.select-colors-theme .default');
            if (defaultElement) {
                defaultElement.classList.add('active');
            }

            // Remove 'active' class from image-menu-background elements
            document.querySelectorAll('.image-menu-background .active').forEach(element => {
                element.classList.remove('active');
            });

            // Set the src attribute of logo_header to tflight
            if (logoHeader && tflight) {
                (logoHeader as HTMLImageElement).setAttribute('src', tflight);
            }
        };

        const clearButton = document.querySelector('.form-theme-color .button-clear-select');
        if (clearButton) {
            clearButton.addEventListener('click', handleClearButtonClick);
        }

        return () => {
            if (clearButton) {
                clearButton.removeEventListener('click', handleClearButtonClick);
            }
        };
    }, []);

    return null; 
}

export default Clearbtn2;

