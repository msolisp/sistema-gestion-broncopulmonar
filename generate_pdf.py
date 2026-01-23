import os

output_file = "test_6mb.pdf"
target_size = 6 * 1024 * 1024

with open(output_file, "wb") as f:
    f.write(b"%PDF-1.4\n")
    # Minimal object to make it semi-valid
    f.write(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    f.write(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    f.write(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n")
    f.write(b"4 0 obj\n<< /Length 5 0 R >>\nstream\n")
    
    # Write junk to fill space
    current_size = f.tell()
    # Reserve bytes for footer (~100 bytes)
    padding_size = target_size - current_size - 100
    
    chunk_size = 1024 * 1024
    written = 0
    while written < padding_size:
        to_write = min(chunk_size, padding_size - written)
        f.write(b" " * to_write)
        written += to_write
        
    f.write(b"\nendstream\nendobj\n")
    f.write(b"5 0 obj\n" + str(written).encode() + b"\nendobj\n")
    f.write(b"xref\n0 6\n0000000000 65535 f \n")
    f.write(b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n")

print(f"Created {output_file} with size {os.path.getsize(output_file)} bytes")
