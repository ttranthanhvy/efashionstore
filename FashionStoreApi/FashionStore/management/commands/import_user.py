import csv
from pathlib import Path

from cloudinary.uploader import upload
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Continue importing users from CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)

    def handle(self, *args, **options):

        csv_file = options["csv_file"]
        log_file = Path("import_users.log.txt")

        # =====================================================
        # Tạo log mới
        # =====================================================
        with open(log_file, "w", encoding="utf-8") as log:

            log.write("=" * 70 + "\n")
            log.write("USER IMPORT LOG\n")
            log.write("=" * 70 + "\n\n")

        # =====================================================
        # Ghi log
        # =====================================================
        def write_skip_log(index, user_id, email, reason, error=None):

            with open(log_file, "a", encoding="utf-8") as log:

                log.write(f"[Row {index}]\n")

                log.write(f"User ID: {user_id}\n")

                log.write(f"Email: {email}\n")

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
        # Load User ID đã tồn tại
        # =====================================================
        existing_user_ids = set(User.objects.values_list("id", flat=True))

        # =====================================================
        # Load Email đã tồn tại
        # =====================================================
        existing_emails = set(User.objects.values_list("email", flat=True))

        # =====================================================
        # Counter
        # =====================================================
        success_count = 0
        skip_count = 0

        skip_reasons = {
            "Already exists": 0,
            "Email already exists": 0,
            "Missing user_id": 0,
            "Invalid user_id": 0,
            "Missing email": 0,
            "Missing password": 0,
            "Missing first_name": 0,
            "Missing last_name": 0,
            "Invalid role": 0,
            "Missing avatar": 0,
            "Cloudinary error": 0,
            "Database error": 0,
            "Duplicate CSV": 0,
            "Unknown error": 0,
        }

        # =====================================================
        # Theo dõi user đã import trong CSV
        # =====================================================
        imported_user_ids = set()
        imported_emails = set()

        # =====================================================
        # Import
        # =====================================================
        for index, row in enumerate(rows, start=1):

            user_id_raw = row.get("user_id", "").strip()

            email = row.get("email", "").strip()

            first_name = row.get("first_name", "").strip()

            last_name = row.get("last_name", "").strip()

            password = row.get("password", "").strip()

            role = row.get("role", "").strip().upper()

            try:

                # =================================================
                # User ID
                # =================================================
                if not user_id_raw:

                    skip_count += 1

                    skip_reasons["Missing user_id"] += 1

                    write_skip_log(index, user_id_raw, email, "Missing user_id")

                    continue

                try:

                    user_id = int(float(user_id_raw))

                except ValueError:

                    skip_count += 1

                    skip_reasons["Invalid user_id"] += 1

                    write_skip_log(index, user_id_raw, email, "Invalid user_id")

                    continue

                # =================================================
                # User đã tồn tại
                # =================================================
                if user_id in existing_user_ids:

                    skip_count += 1

                    skip_reasons["Already exists"] += 1

                    write_skip_log(
                        index, user_id, email, "User ID already exists in database"
                    )

                    continue

                # =================================================
                # Duplicate User ID trong CSV
                # =================================================
                if user_id in imported_user_ids:

                    skip_count += 1

                    skip_reasons["Duplicate CSV"] += 1

                    write_skip_log(index, user_id, email, "Duplicate user_id in CSV")

                    continue

                # =================================================
                # Email
                # =================================================
                if not email:

                    skip_count += 1

                    skip_reasons["Missing email"] += 1

                    write_skip_log(index, user_id, email, "Missing email")

                    continue

                email_lower = email.lower()

                # =================================================
                # Email đã tồn tại
                # =================================================
                if (
                    email in existing_emails
                    or email_lower in existing_emails
                    or email in imported_emails
                    or email_lower in imported_emails
                ):

                    skip_count += 1

                    skip_reasons["Email already exists"] += 1

                    write_skip_log(
                        index, user_id, email, "Email already exists in database or CSV"
                    )

                    continue

                # =================================================
                # Password
                # =================================================
                if not password:

                    skip_count += 1

                    skip_reasons["Missing password"] += 1

                    write_skip_log(index, user_id, email, "Missing password")

                    continue

                # =================================================
                # First name
                # =================================================
                if not first_name:

                    skip_count += 1

                    skip_reasons["Missing first_name"] += 1

                    write_skip_log(index, user_id, email, "Missing first_name")

                    continue

                # =================================================
                # Last name
                # =================================================
                if not last_name:

                    skip_count += 1

                    skip_reasons["Missing last_name"] += 1

                    write_skip_log(index, user_id, email, "Missing last_name")

                    continue

                # =================================================
                # Role
                # =================================================
                valid_roles = {
                    User.Role.ADMIN,
                    User.Role.STAFF,
                    User.Role.CUSTOMER,
                }

                if role not in valid_roles:

                    skip_count += 1

                    skip_reasons["Invalid role"] += 1

                    write_skip_log(index, user_id, email, "Invalid role", role)

                    continue

                # =================================================
                # Avatar
                # =================================================
                avatar_url = row.get("avatar", "").strip()

                public_id = "default_avatar_woxm90"

                if avatar_url:

                    try:

                        result = upload(avatar_url)

                        public_id = result["public_id"]

                    except Exception as e:

                        skip_count += 1

                        skip_reasons["Cloudinary error"] += 1

                        write_skip_log(
                            index, user_id, email, "Avatar upload failed", str(e)
                        )

                        continue

                # =================================================
                # Create User
                # =================================================
                try:

                    user = User(
                        id=user_id,
                        username=email,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        avatar=public_id,
                        role=role,
                        is_approved=False,
                    )

                    # Hash password
                    user.set_password(password)

                    user.save()

                except Exception as e:

                    skip_count += 1

                    skip_reasons["Database error"] += 1

                    write_skip_log(index, user_id, email, "Database error", str(e))

                    continue

                # =================================================
                # Thành công
                # =================================================
                imported_user_ids.add(user_id)

                existing_user_ids.add(user_id)

                imported_emails.add(email)

                imported_emails.add(email_lower)

                existing_emails.add(email)

                existing_emails.add(email_lower)

                success_count += 1

            except Exception as e:

                skip_count += 1

                skip_reasons["Unknown error"] += 1

                write_skip_log(index, user_id_raw, email, "Unknown error", str(e))

            # =====================================================
            # CHỈ HIỆN 1 DÒNG TRẠNG THÁI
            # =====================================================
            print(
                f"\rImporting users: "
                f"{index}/{total} "
                f"| Success: {success_count} "
                f"| Skip: {skip_count}",
                end="",
                flush=True,
            )

        print()

        # =====================================================
        # Summary
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
            self.style.SUCCESS(f"Import success: " f"{success_count} user.")
        )

        if skip_count > 0:

            self.stdout.write(self.style.WARNING(f"Skip: {skip_count} user."))

        self.stdout.write(f"Total CSV: {total} user.")

        self.stdout.write(f"Log: {log_file}")
