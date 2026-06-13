from PIL import Image
import numpy as np

C = np.zeros((8, 8))
for i in range(8):
    for j in range(8):
        if i == 0:
            C[i, j] = 1.0 / np.sqrt(8.0)
        else:
            C[i, j] = np.sqrt(2.0 / 8.0) * np.cos((2 * j + 1) * i * np.pi / 16.0)

def embed_watermark_dct(image_path: str, watermark_data: str, output_path: str) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    binary_data = "".join(format(ord(c), "08b") for c in watermark_data) + "00000000"
    bits = [int(b) for b in binary_data]

    h, w, _ = img_array.shape
    block_size = 8
    bit_idx = 0
    Q = 16

    for i in range(0, h - block_size + 1, block_size):
        for j in range(0, w - block_size + 1, block_size):
            if bit_idx >= len(bits):
                break

            block = img_array[i:i+block_size, j:j+block_size, 1]
            dct_block = C @ block @ C.T

            dc = dct_block[0, 0]
            bit = bits[bit_idx]

            q_coeff = round(dc / Q)
            if q_coeff % 2 != bit:
                if q_coeff > (dc / Q):
                    q_coeff -= 1
                else:
                    q_coeff += 1
            dct_block[0, 0] = q_coeff * Q

            reconstructed = C.T @ dct_block @ C
            img_array[i:i+block_size, j:j+block_size, 1] = np.clip(reconstructed, 0, 255)
            bit_idx += 1

        if bit_idx >= len(bits):
            break

    output = Image.fromarray(img_array.astype(np.uint8))
    output.save(output_path, quality=95)
    return output_path

def decode_watermark_dct(image_path: str, max_bits: int = 512) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    h, w, _ = img_array.shape
    block_size = 8
    extracted_bits = []
    Q = 16

    for i in range(0, h - block_size + 1, block_size):
        for j in range(0, w - block_size + 1, block_size):
            if len(extracted_bits) >= max_bits:
                break

            block = img_array[i:i+block_size, j:j+block_size, 1]
            dct_block = C @ block @ C.T
            dc = dct_block[0, 0]

            extracted_bits.append(round(dc / Q) % 2)

        if len(extracted_bits) >= max_bits:
            break

    chars = []
    for i in range(0, len(extracted_bits) - 7, 8):
        byte = extracted_bits[i:i+8]
        char_val = int("".join(str(b) for b in byte), 2)
        if char_val == 0:
            break
        if 32 <= char_val <= 126:
            chars.append(chr(char_val))
        else:
            break

    return "".join(chars)

def embed_printer_fingerprint(image_path: str, fingerprint_data: str, output_path: str) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    binary_data = "".join(format(ord(c), "08b") for c in fingerprint_data) + "00000000"
    bits = [int(b) for b in binary_data]

    h, w, _ = img_array.shape
    margin_size = 16
    bit_idx = 0
    Q = 8

    for i in range(h - margin_size, h):
        for j in range(0, w):
            if bit_idx >= len(bits):
                break
            pixel_val = img_array[i, j, 2]
            bit = bits[bit_idx]
            q_val = round(pixel_val / Q)
            if q_val % 2 != bit:
                if q_val > (pixel_val / Q):
                    q_val -= 1
                else:
                    q_val += 1
            img_array[i, j, 2] = np.clip(q_val * Q, 0, 255)
            bit_idx += 1
        if bit_idx >= len(bits):
            break

    output = Image.fromarray(img_array.astype(np.uint8))
    output.save(output_path, quality=95)
    return output_path

def decode_printer_fingerprint(image_path: str, max_bits: int = 512) -> str:
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img, dtype=np.float32)

    h, w, _ = img_array.shape
    margin_size = 16
    extracted_bits = []
    Q = 8

    for i in range(h - margin_size, h):
        for j in range(0, w):
            if len(extracted_bits) >= max_bits:
                break
            pixel_val = img_array[i, j, 2]
            extracted_bits.append(round(pixel_val / Q) % 2)
        if len(extracted_bits) >= max_bits:
            break

    chars = []
    for i in range(0, len(extracted_bits) - 7, 8):
        byte = extracted_bits[i:i+8]
        char_val = int("".join(str(b) for b in byte), 2)
        if char_val == 0:
            break
        if 32 <= char_val <= 126:
            chars.append(chr(char_val))
        else:
            break

    return "".join(chars)
