import csv
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from FashionStore.models import Rating, Product, User


class Command(BaseCommand):
    help = "Continue importing ratings from CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)

    def handle(self, *args, **options):

        csv_file = options["csv_file"]
        log_file = Path("import_ratings.log.txt")

        # =====================================================
        # Tạo log mới
        # =====================================================
        with open(log_file, "w", encoding="utf-8") as log:

            log.write("=" * 70 + "\n")
            log.write("RATING IMPORT LOG\n")
            log.write("=" * 70 + "\n\n")

        # =====================================================
        # Ghi log
        # =====================================================
        def write_skip_log(index, product_id, customer_id, reason, error=None):

            with open(log_file, "a", encoding="utf-8") as log:

                log.write(f"[Row {index}]\n")

                log.write(f"Product ID: {product_id}\n")

                log.write(f"Customer ID: {customer_id}\n")

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
        # Load User
        # =====================================================
        user_map = {user.id: user for user in User.objects.all()}

        # =====================================================
        # Load Rating đã tồn tại
        #
        # UniqueConstraint:
        # user + product
        # =====================================================
        existing_ratings = set(Rating.objects.values_list("user_id", "product_id"))

        # =====================================================
        # Counter
        # =====================================================
        success_count = 0
        skip_count = 0

        skip_reasons = {
            "Already exists": 0,
            "Missing product_id": 0,
            "Product not found": 0,
            "Missing customer_id": 0,
            "Customer not found": 0,
            "Missing rating": 0,
            "Invalid rating": 0,
            "Invalid rating range": 0,
            "Duplicate CSV": 0,
            "Missing comment": 0,
            "Database error": 0,
            "Unknown error": 0,
        }

        # =====================================================
        # Theo dõi rating đã import trong lần chạy này
        # =====================================================
        imported_ratings = set()

        # =====================================================
        # Import
        # =====================================================
        for index, row in enumerate(rows, start=1):

            product_id_raw = row.get("product_id", "").strip()

            customer_id_raw = row.get("customer_id", "").strip()

            rating_raw = row.get("rating", "").strip()

            comment = row.get("content", "").strip()

            try:

                # =================================================
                # Product ID
                # =================================================
                if not product_id_raw:

                    skip_count += 1

                    skip_reasons["Missing product_id"] += 1

                    write_skip_log(
                        index, product_id_raw, customer_id_raw, "Missing product_id"
                    )

                    continue

                try:

                    product_id = int(float(product_id_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Product not found"] += 1

                    write_skip_log(
                        index, product_id_raw, customer_id_raw, "Invalid product_id"
                    )

                    continue

                # =================================================
                # Tìm Product
                # =================================================
                product = product_map.get(product_id)

                if product is None:

                    skip_count += 1

                    skip_reasons["Product not found"] += 1

                    write_skip_log(
                        index,
                        product_id,
                        customer_id_raw,
                        f"Product {product_id} not found",
                    )

                    continue

                # =================================================
                # Customer ID
                # =================================================
                if not customer_id_raw:

                    skip_count += 1

                    skip_reasons["Missing customer_id"] += 1

                    write_skip_log(
                        index, product_id, customer_id_raw, "Missing customer_id"
                    )

                    continue

                try:

                    customer_id = int(float(customer_id_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Customer not found"] += 1

                    write_skip_log(
                        index, product_id, customer_id_raw, "Invalid customer_id"
                    )

                    continue

                # =================================================
                # Tìm User
                # =================================================
                user = user_map.get(customer_id)

                if user is None:

                    skip_count += 1

                    skip_reasons["Customer not found"] += 1

                    write_skip_log(
                        index,
                        product_id,
                        customer_id,
                        f"Customer {customer_id} not found",
                    )

                    continue

                # =================================================
                # Check duplicate DB
                # =================================================
                rating_key = (customer_id, product_id)

                if rating_key in existing_ratings:

                    skip_count += 1

                    skip_reasons["Already exists"] += 1

                    write_skip_log(
                        index,
                        product_id,
                        customer_id,
                        "Rating already exists for this user and product",
                    )

                    continue

                # =================================================
                # Duplicate trong CSV
                # =================================================
                if rating_key in imported_ratings:

                    skip_count += 1

                    skip_reasons["Duplicate CSV"] += 1

                    write_skip_log(
                        index,
                        product_id,
                        customer_id,
                        "Duplicate user + product in CSV",
                    )

                    continue

                # =================================================
                # Rating
                # =================================================
                if not rating_raw:

                    skip_count += 1

                    skip_reasons["Missing rating"] += 1

                    write_skip_log(index, product_id, customer_id, "Missing rating")

                    continue

                try:

                    rate = int(float(rating_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Invalid rating"] += 1

                    write_skip_log(
                        index, product_id, customer_id, "Invalid rating", rating_raw
                    )

                    continue

                # =================================================
                # Rating phải từ 1 -> 5
                # =================================================
                if rate < 1 or rate > 5:

                    skip_count += 1

                    skip_reasons["Invalid rating range"] += 1

                    write_skip_log(
                        index,
                        product_id,
                        customer_id,
                        "Rating must be between 1 and 5",
                        str(rate),
                    )

                    continue

                # =================================================
                # Comment
                # =================================================
                if not comment:

                    comment = None

                elif len(comment) > 500:

                    skip_count += 1

                    skip_reasons["Missing comment"] += 1

                    write_skip_log(
                        index,
                        product_id,
                        customer_id,
                        "Comment longer than 500 characters",
                    )

                    continue

                # =================================================
                # Tạo Rating
                # =================================================
                try:

                    Rating.objects.create(
                        rate=rate, comment=comment, user=user, product=product
                    )

                except Exception as e:

                    skip_count += 1

                    skip_reasons["Database error"] += 1

                    write_skip_log(
                        index, product_id, customer_id, "Database error", str(e)
                    )

                    continue

                # =================================================
                # Thành công
                # =================================================
                imported_ratings.add(rating_key)

                existing_ratings.add(rating_key)

                success_count += 1

            except Exception as e:

                skip_count += 1

                skip_reasons["Unknown error"] += 1

                write_skip_log(
                    index, product_id_raw, customer_id_raw, "Unknown error", str(e)
                )

            # =====================================================
            # CHỈ HIỆN 1 DÒNG TRẠNG THÁI
            # =====================================================
            print(
                f"\rImporting ratings: "
                f"{index}/{total} "
                f"| Success: {success_count} "
                f"| Skip: {skip_count}",
                end="",
                flush=True,
            )

        print()

        # =====================================================
        # Ghi Summary
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
            self.style.SUCCESS(f"Import success: {success_count} rating.")
        )

        if skip_count > 0:

            self.stdout.write(self.style.WARNING(f"Skip: {skip_count} rating."))

        self.stdout.write(f"Total CSV: {total} rating.")

        self.stdout.write(f"Log: {log_file}")
