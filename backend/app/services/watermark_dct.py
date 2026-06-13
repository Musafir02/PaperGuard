import os
from PIL import Image
import numpy as np


WATERMARK_STRENGTH = 3


def embed_watermark_dct(image_path: str, watermark_data: str, output_path: str) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    binary_data = "".join(format(ord(c), "08b") for c in watermark_data)
    bits = [int(b) for b in binary_data]

    h, w, _ = img_array.shape
    block_size = 8
    bit_idx = 0

    for i in range(0, h - block_size + 1, block_size):
        for j in range(0, w - block_size + 1, block_size):
            if bit_idx >= len(bits):
                break

            block = img_array[i:i+block_size, j:j+block_size, 0]
            dct_block = np.fft.dct(np.fft.idct(block))

            dc_coeff = dct_block[0, 0]
            target_bit = bits[bit_idx]

            if target_bit == 1:
                dct_block[0, 0] = dc_coeff + WATERMARK_STRENGTH if dc_coeff % 2 == 0 else dc_coeff
                if dct_block[0, 0] % 2 != 1:
                    dct_block[0, 0] += WATERMARK_STRENGTH
            else:
                dct_block[0, 0] = dc_coeff - WATERMARK_STRENGTH if dc_coeff % 2 == 1 else dc_coeff
                if dct_block[0, 0] % 2 != 0:
                    dct_block[0, 0] -= WATERMARK_STRENGTH

            reconstructed = np.fft.idct(np.fft.idct(dct_block))
            img_array[i:i+block_size, j:j+block_size, 0] = np.clip(reconstructed, 0, 255)
            bit_idx += 1

        if bit_idx >= len(bits):
            break

    output = Image.fromarray(img_array.astype(np.uint8))
    output.save(output_path, quality=95)
    return output_path


def decode_watermark_dct(image_path: str, max_bits: int = 256) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    h, w, _ = img_array.shape
    block_size = 8
    extracted_bits = []

    for i in range(0, h - block_size + 1, block_size):
        for j in range(0, w - block_size + 1, block_size):
            if len(extracted_bits) >= max_bits:
                break

            block = img_array[i:i+block_size, j:j+block_size, 0]
            dct_block = np.fft.dct(np.fft.idct(block))
            dc_coeff = dct_block[0, 0]

            extracted_bits.append(1 if dc_coeff % 2 != 0 else 0)

        if len(extracted_bits) >= max_bits:
            break

    chars = []
    for i in range(0, len(extracted_bits) - 7, 8):
        byte = extracted_bits[i:i+8]
        char_val = int("".join(str(b) for b in byte), 2)
        if 32 <= char_val <= 126:
            chars.append(chr(char_val))
        elif char_val == 0:
            break
        else:
            break

    return "".join(chars)


def embed_printer_fingerprint(image_path: str, fingerprint_data: str, output_path: str) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    binary_data = "".join(format(ord(c), "08b") for c in fingerprint_data)
    bits = [int(b) for b in binary_data]

    h, w, _ = img_array.shape
    margin_size = 20
    bit_idx = 0

    for i in range(h - margin_size, h):
        for j in range(0, min(w, len(bits) * 2)):
            if bit_idx >= len(bits):
                break
            pixel_val = img_array[i, j, 2]
            target_bit = bits[bit_idx]
            if target_bit == 1:
                img_array[i, j, 2] = pixel_val if pixel_val % 2 == 1 else pixel_val + 1
            else:
                img_array[i, j, 2] = pixel_val if pixel_val % 2 == 0 else pixel_val - 1
            img_array[i, j, 2] = np.clip(img_array[i, j, 2], 0, 255)
            bit_idx += 2

        if bit_idx >= len(bits):
            break

    output = Image.fromarray(img_array.astype(np.uint8))
    output.save(output_path, quality=95)
    return output_path


def decode_printer_fingerprint(image_path: str, max_bits: int = 128) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    h, w, _ = img_array.shape
    margin_size = 20
    extracted_bits = []

    for i in range(h - margin_size, h):
        for j in range(0, w):
            if len(extracted_bits) >= max_bits:
                break
            pixel_val = img_array[i, j, 2]
            extracted_bits.append(1 if pixel_val % 2 != 1 else 0)
            extracted_bits.append(1 if pixel_val % 2 != 1 else 0)

        if len(extracted_bits) >= max_bits:
            break

    chars = []
    for i in range(0, len(extracted_bits) - 7, 8):
        byte = extracted_bits[i:i+8]
        char_val = int("".join(str(b) for b in byte), 2)
        if 32 <= char_val <= 126:
            chars.append(chr(char_val))
        elif char_val == 0:
            break
        else:
            break

    return "".join(chars)
