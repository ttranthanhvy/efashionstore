import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from cloudinary.uploader import upload
from django.core.management.base import BaseCommand

from FashionStore.models import Product, ProductVariant


class Command(BaseCommand):
    help = "Continue importing product variants from CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)

    def handle(self, *args, **options):

        csv_file = options["csv_file"]
        log_file = Path("import_variants.log.txt")

        # =====================================================
        # Tạo log mới
        # =====================================================
        with open(log_file, "w", encoding="utf-8") as log:

            log.write("=" * 70 + "\n")
            log.write("PRODUCT VARIANT IMPORT LOG\n")
            log.write("=" * 70 + "\n\n")

        # =====================================================
        # Ghi log
        # =====================================================
        def write_skip_log(
            index, variant_id, product_id, color, size, reason, error=None
        ):

            with open(log_file, "a", encoding="utf-8") as log:

                log.write(f"[Row {index}]\n")

                log.write(f"Variant ID: {variant_id}\n")

                log.write(f"Product ID: {product_id}\n")

                log.write(f"Color: {color}\n")

                log.write(f"Size: {size}\n")

                log.write(f"Reason: {reason}\n")

                if error:
                    log.write(f"Error: {error}\n")

                log.write("-" * 70 + "\n")

        # =====================================================
        # Đọc CSV
        # =====================================================
        try:

            with open(csv_file, newline="", encoding="utf-8-sig") as file:

                reader = csv.DictReader(file)
                rows = list(reader)

        except FileNotFoundError:

            self.stdout.write(self.style.ERROR(f"Không tìm thấy file: {csv_file}"))

            return

        total = len(rows)

        # =====================================================
        # Load Product
        # =====================================================
        product_map = {product.id: product for product in Product.objects.all()}

        # =====================================================
        # Load các Variant đã tồn tại
        # =====================================================
        existing_variant_ids = set(ProductVariant.objects.values_list("id", flat=True))

        # =====================================================
        # Counter
        # =====================================================
        success_count = 0
        skip_count = 0

        skip_reasons = {
            "Already exists": 0,
            "Missing product_variant_id": 0,
            "Missing product_id": 0,
            "Product not found": 0,
            "Missing image": 0,
            "Missing price": 0,
            "Invalid price": 0,
            "Missing stock": 0,
            "Invalid stock": 0,
            "Missing min_stock": 0,
            "Invalid min_stock": 0,
            "Cloudinary error": 0,
            "Database error": 0,
            "Duplicate CSV": 0,
            "Unknown error": 0,
        }

        # =====================================================
        # Theo dõi ID đã import trong lần chạy này
        # =====================================================
        imported_ids = set()

        # =====================================================
        # Import
        # =====================================================
        for index, row in enumerate(rows, start=1):

            variant_id_raw = row.get("product_variant_id", "").strip()

            product_id_raw = row.get("product_id", "").strip()

            color = row.get("color", "").strip()

            size = row.get("size", "").strip()

            try:

                # -------------------------------------------------
                # Variant ID
                # -------------------------------------------------
                if not variant_id_raw:

                    skip_count += 1

                    skip_reasons["Missing product_variant_id"] += 1

                    write_skip_log(
                        index,
                        variant_id_raw,
                        product_id_raw,
                        color,
                        size,
                        "Missing product_variant_id",
                    )

                    continue

                try:

                    variant_id = int(float(variant_id_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Unknown error"] += 1

                    write_skip_log(
                        index,
                        variant_id_raw,
                        product_id_raw,
                        color,
                        size,
                        "Invalid product_variant_id",
                    )

                    continue

                # -------------------------------------------------
                # ĐÃ TỒN TẠI TRONG DATABASE
                # -------------------------------------------------
                if variant_id in existing_variant_ids:

                    skip_count += 1

                    skip_reasons["Already exists"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id_raw,
                        color,
                        size,
                        "Variant already exists in database",
                    )

                    continue

                # -------------------------------------------------
                # Duplicate trong chính CSV
                # -------------------------------------------------
                if variant_id in imported_ids:

                    skip_count += 1

                    skip_reasons["Duplicate CSV"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id_raw,
                        color,
                        size,
                        "Duplicate product_variant_id in CSV",
                    )

                    continue

                # -------------------------------------------------
                # Product ID
                # -------------------------------------------------
                if not product_id_raw:

                    skip_count += 1

                    skip_reasons["Missing product_id"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id_raw,
                        color,
                        size,
                        "Missing product_id",
                    )

                    continue

                try:

                    product_id = int(float(product_id_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Unknown error"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id_raw,
                        color,
                        size,
                        "Invalid product_id",
                    )

                    continue

                # -------------------------------------------------
                # Tìm Product
                # -------------------------------------------------
                product = product_map.get(product_id)

                if product is None:

                    skip_count += 1

                    skip_reasons["Product not found"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id,
                        color,
                        size,
                        f"Product {product_id} not found",
                    )

                    continue

                # -------------------------------------------------
                # Image
                # -------------------------------------------------
                image_url = row.get("image", "").strip()

                if not image_url:

                    skip_count += 1

                    skip_reasons["Missing image"] += 1

                    write_skip_log(
                        index, variant_id, product_id, color, size, "Missing image"
                    )

                    continue

                # -------------------------------------------------
                # Price
                # -------------------------------------------------
                price_raw = row.get("price", "").strip()

                if not price_raw:

                    skip_count += 1

                    skip_reasons["Missing price"] += 1

                    write_skip_log(
                        index, variant_id, product_id, color, size, "Missing price"
                    )

                    continue

                try:

                    price = Decimal(price_raw)

                except InvalidOperation:

                    skip_count += 1

                    skip_reasons["Invalid price"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id,
                        color,
                        size,
                        "Invalid price",
                        price_raw,
                    )

                    continue

                # -------------------------------------------------
                # Stock
                # -------------------------------------------------
                stock_raw = row.get("stock", "").strip()

                if not stock_raw:

                    skip_count += 1

                    skip_reasons["Missing stock"] += 1

                    write_skip_log(
                        index, variant_id, product_id, color, size, "Missing stock"
                    )

                    continue

                try:

                    stock = int(float(stock_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Invalid stock"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id,
                        color,
                        size,
                        "Invalid stock",
                        stock_raw,
                    )

                    continue

                # -------------------------------------------------
                # Min stock
                # -------------------------------------------------
                min_stock_raw = row.get("min_stock", "").strip()

                if not min_stock_raw:

                    skip_count += 1

                    skip_reasons["Missing min_stock"] += 1

                    write_skip_log(
                        index, variant_id, product_id, color, size, "Missing min_stock"
                    )

                    continue

                try:

                    min_stock = int(float(min_stock_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Invalid min_stock"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id,
                        color,
                        size,
                        "Invalid min_stock",
                        min_stock_raw,
                    )

                    continue

                # -------------------------------------------------
                # Upload Cloudinary
                # -------------------------------------------------
                try:

                    result = upload(image_url)

                    public_id = result["public_id"]

                except Exception as e:

                    skip_count += 1

                    skip_reasons["Cloudinary error"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id,
                        color,
                        size,
                        "Cloudinary upload failed",
                        str(e),
                    )

                    continue

                # -------------------------------------------------
                # Create Variant
                # -------------------------------------------------
                try:

                    ProductVariant.objects.create(
                        id=variant_id,
                        image=public_id,
                        size=size or None,
                        price=price,
                        color=color or None,
                        min_stock=min_stock,
                        stock=stock,
                        is_active=True,
                        product=product,
                    )

                except Exception as e:

                    skip_count += 1

                    skip_reasons["Database error"] += 1

                    write_skip_log(
                        index,
                        variant_id,
                        product_id,
                        color,
                        size,
                        "Database error",
                        str(e),
                    )

                    continue

                # -------------------------------------------------
                # Thành công
                # -------------------------------------------------
                imported_ids.add(variant_id)

                existing_variant_ids.add(variant_id)

                success_count += 1

            except Exception as e:

                skip_count += 1

                skip_reasons["Unknown error"] += 1

                write_skip_log(
                    index,
                    variant_id_raw,
                    product_id_raw,
                    color,
                    size,
                    "Unknown error",
                    str(e),
                )

            # =====================================================
            # CHỈ HIỆN 1 DÒNG TRẠNG THÁI
            # =====================================================
            print(
                f"\rImporting variants: "
                f"{index}/{total} "
                f"| Success: {success_count} "
                f"| Skip: {skip_count}",
                end="",
                flush=True,
            )

        print()

        # =====================================================
        # Summary vào log
        # =====================================================
        with open(log_file, "a", encoding="utf-8") as log:

            log.write("\n")
            log.write("=" * 70 + "\n")
            log.write("IMPORT SUMMARY\n")
            log.write("=" * 70 + "\n")

            log.write(f"Total: {total}\n")

            log.write(f"Success: {success_count}\n")

            log.write(f"Skip: {skip_count}\n")

            log.write("\n")
            log.write("SKIP REASONS\n")
            log.write("-" * 70 + "\n")

            for reason, count in skip_reasons.items():

                if count > 0:

                    log.write(f"{reason}: {count}\n")

            log.write("=" * 70 + "\n")

        # =====================================================
        # Kết quả cuối
        # =====================================================
        self.stdout.write(
            self.style.SUCCESS(f"Import success: " f"{success_count} variant.")
        )

        if skip_count > 0:

            self.stdout.write(self.style.WARNING(f"Skip: {skip_count} variant."))

        self.stdout.write(f"Total CSV: {total} variant.")

        self.stdout.write(f"Log: {log_file}")
