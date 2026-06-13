EXAM_CENTERS_DATASET = [
    {
        "center_id": "MH-001",
        "name": "Vidyalankar Institute of Technology",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "security_description": "Located in a highly secure educational zone with multi-layered perimeter access controls. The facility has robust CCTV infrastructure covering all corridors and printing rooms, with backup power units ensuring zero operational downtime. Security staff undergo regular training and background checks. Biometric access controls are present at all entry points to critical document storage zones.",
        "coaching_proximity_description": "The center is situated in an academic suburb of Mumbai. There are no major residential coaching centers within a five-kilometer radius, minimizing the threat of localized question leakage or coordinated cheating operations. Transit routes to the center are highly public and well-monitored by municipal surveillance systems, reducing risk during physical transport of papers.",
        "audit_history": "The center successfully hosted major national exams over the last four years without a single reported anomaly. Previous audit reports highlight excellent compliance with invigilator protocols and timely envelope opening procedures. External observers consistently rate this facility as low-risk, praising the structured queue management and clear separation of printing areas from student zones.",
        "risk_profile": "low"
    },
    {
        "center_id": "RJ-042",
        "name": "Allen Career Institute",
        "city": "Kota",
        "state": "Rajasthan",
        "latitude": 25.2138,
        "longitude": 75.8648,
        "security_description": "The facility has modern infrastructure but suffers from high student density during peak exam cycles. CCTV coverage is comprehensive but has historically experienced intermittent signal drops. Access control to the server room relies on digital keycards, but log reviews indicate occasional sharing of credentials among technical staff. Physical security personnel are outsourced from local agencies.",
        "coaching_proximity_description": "Situated in the core coaching hub of India, surrounded by hundreds of competitive exam preparation hostels. The proximity to aggressive coaching networks creates an exceptionally high threat environment. Local networks often attempt to bribe center staff or deploy advanced surveillance equipment to intercept signals, requiring continuous electronic jamming and surveillance sweeps.",
        "audit_history": "A security audit conducted in late 2025 flagged minor procedural delays in paper decryption keys. Observer reports noted that unauthorized personnel were seen near the printing room window during a state-level exam. While no active leak occurred, the facility was recommended for strict monitoring and mandatory external super-invigilators during high-stakes national assessments.",
        "risk_profile": "high"
    },
    {
        "center_id": "RJ-087",
        "name": "Sikar Public School",
        "city": "Sikar",
        "state": "Rajasthan",
        "latitude": 27.6094,
        "longitude": 75.1399,
        "security_description": "A semi-urban school building with basic physical security. The outer boundary wall is low and lacks barbed wiring, making perimeter breaches possible. CCTV cameras are only present at the main entrance and the principal's office, with no coverage in the printing room or individual halls. Power backup is limited to a single diesel generator.",
        "coaching_proximity_description": "Located in a prominent coaching town that has seen a surge in competitive preparation academies. Multiple coaching centers operate within two kilometers of the school. Local student groups have a history of protest, and intelligence reports suggest coaching operators maintain active contacts with school administrative staff, posing a significant threat of insider collusion.",
        "audit_history": "The facility was flagged during the 2024 state recruitment exam due to a verified incident of phone usage inside the exam hall. The invigilator on duty was suspended, and subsequent investigations revealed a lack of proper metallic screening at the entrance. The center has not resolved these security gaps, leading to a recommended block on high-stakes exams.",
        "risk_profile": "block"
    },
    {
        "center_id": "BR-015",
        "name": "Patna Academy",
        "city": "Patna",
        "state": "Bihar",
        "latitude": 25.6093,
        "longitude": 85.1376,
        "security_description": "An older institutional building with moderate physical security. The printing room is situated on the ground floor with windows facing an open alleyway, which presents a high risk of visual intercept. CCTV cameras are installed but operate on a local DVR without offsite cloud backup, making the footage vulnerable to tampering.",
        "coaching_proximity_description": "Patna is a historical hotspot for exam paper leaks and organized solver gangs. The center is located within a densely populated residential area with several private tutoring centers nearby. Local law enforcement presence is inconsistent, and transport vehicles carrying exam papers have historically faced coordination delays in this congested transit corridor.",
        "audit_history": "Audit reviews indicate that the center failed to execute the pre-print isolation protocol during the last national mock run. Invigilators did not verify the SHA-256 hash of the decryption package before initiating the print sequence. Additionally, two unauthorized staff members were present in the decryption room during the key generation phase.",
        "risk_profile": "high"
    },
    {
        "center_id": "DL-003",
        "name": "Vidyamandir Classes",
        "city": "Delhi",
        "state": "Delhi",
        "latitude": 28.7041,
        "longitude": 77.1025,
        "security_description": "A premium urban testing facility equipped with state-of-the-art security systems. Features include full-spectrum signal jammers, biometrically locked printing enclosures, and real-time CCTV feeds streamed directly to the central agency dashboard. The facility layout ensures complete isolation of the exam execution team from the rest of the campus.",
        "coaching_proximity_description": "Located in a commercial zone of North Delhi with minimal coaching centers in the immediate vicinity. The surrounding roads are wide and under constant traffic police surveillance, ensuring secure transport. The building is isolated from residential blocks, minimizing the risk of unauthorized long-range Wi-Fi or radio frequency interception.",
        "audit_history": "The center has maintained a perfect audit record for five consecutive years. Independent observers note that the center administrator is highly strict with staff cell phone bans. The pre-print protocol is always executed precisely, with dual-authentication keys verified and logs written to the audit chain without any latency or discrepancies.",
        "risk_profile": "low"
    }
]
