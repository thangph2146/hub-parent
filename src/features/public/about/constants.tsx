import { TypographyPLargeMuted, TypographyPSmallMuted } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import Image from "next/image"
import { School, Library, Trophy, Home, Laptop, GraduationCap } from "lucide-react"

export const CORE_VALUES = [
  {
    title: "CHÍNH TRỰC",
    description:
      "Chính trực trong mọi hành động. HUB luôn nhất quán giữa Tư duy - Lời nói - Hành động.",
    color: "#A41034",
  },
  {
    title: "ĐOÀN KẾT",
    description:
      "Đoàn kết tạo nên sự thống nhất để có sức mạnh tổng hợp. HUB lấy phương châm đảm bảo sự hài hòa lợi ích giữa các bên có liên quan để cùng nhau phát triển.",
    color: "#1F3368",
  },
  {
    title: "TIÊN PHONG",
    description:
      "Tiên phong để tạo ra và dẫn dắt xu hướng. HUB tiên phong trong ứng dụng thành tựu khoa học công nghệ vào các hoạt động đào tạo, nghiên cứu, quản lý, điều hành.",
    color: "#CE395D",
  },
];

export const EDUCATION_PHILOSOPHY = [
  {
    title: "Khai phóng",
    description:
      "HUB tạo môi trường giáo dục giúp người học tự khai phá tiềm năng của bản thân; lĩnh hội kiến thức chuyên môn sâu của ngành học trên nền tảng kiến thức tổng quát toàn diện; phát triển năng lực trí tuệ và kỹ năng cá nhân; định hình các giá trị sống tích cực hướng tới giáo dục con người tự chủ, sáng tạo, công dân có trách nhiệm.",
    color: "#A41034",
  },
  {
    title: "Liên ngành",
    description:
      "HUB hướng đến đào tạo người học có hiểu biết liên ngành nhằm tránh những thiên kiến trong việc ra quyết định, tăng khả năng kết nối các chuyên gia, mở rộng cơ hội việc làm.",
    color: "#1F3368",
  },
  {
    title: "Trải nghiệm",
    description:
      'HUB triển khai mô hình đào tạo "trưởng thành qua trải nghiệm". Qua trải nghiệm, người học sẽ hiểu biết sâu sắc hơn về lý thuyết, hình thành tư duy thực tiễn, năng lực thực thi, từ đó thích nghi và cải tạo môi trường.',
    color: "#CE395D",
  },
];

export const FACILITIES_STATS = [
  { number: "3", label: "Cơ sở đào tạo" },
  { number: "131", label: "Giảng đường" },
  { number: "328", label: "Phòng KTX" },
  { number: "15", label: "Phòng máy thực hành" },
];

export const FACILITY_IMAGES = [
  {
    url: "https://hub.edu.vn/DATA/IMAGES/2024/12/31/20241231235059-1khuanvientruonghoc.jpg",
    category: "Cơ sở vật chất",
    title: "Khuôn viên trường HUB",
  },
  {
    url: "https://hub.edu.vn/DATA/IMAGES/2024/12/31/20241231235033-1khuanvientruonghoc.jpg",
    category: "Giảng đường",
    title: "Phòng học hiện đại",
  },
  {
    url: "https://hub.edu.vn/DATA/IMAGES/2024/12/31/20241231235033-1vehub.jpg",
    category: "Thư viện",
    title: "Không gian tự học",
  },
  {
    url: "https://hub.edu.vn/DATA/IMAGES/2024/12/31/20241231235059-1khuanvientruonghoc.jpg",
    category: "Thể thao",
    title: "Nhà thi đấu đa năng",
  },
];

export const FACILITIES = [
  {
    icon: <School size={24} />,
    title: "Cơ sở đào tạo",
    description: "3 cơ sở đào tạo hiện đại tại TP. Hồ Chí Minh.",
  },
  {
    icon: <Library size={24} />,
    title: "Thư viện",
    description: "Hệ thống thư viện hiện đại với hàng ngàn đầu sách và tài liệu số.",
  },
  {
    icon: <Trophy size={24} />,
    title: "Nhà thi đấu",
    description: "Khu phức hợp thể thao đa năng, sân vận động đạt chuẩn.",
  },
  {
    icon: <Home size={24} />,
    title: "Ký túc xá",
    description: "Hơn 300 phòng ký túc xá tiện nghi, an toàn cho sinh viên.",
  },
  {
    icon: <Laptop size={24} />,
    title: "Phòng máy thực hành",
    description: "Hệ thống phòng máy tính cấu hình cao phục vụ học tập.",
  },
];

export const DEPARTMENTS = [
  {
    name: "Khoa sau Đại học",
    url: "https://khoasdh.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đào tạo trình độ Thạc sĩ và Tiến sĩ các chuyên ngành kinh tế, tài chính, ngân hàng."
  },
  {
    name: "Khoa Ngân hàng",
    url: "https://khoanh.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Khoa mũi nhọn của HUB với bề dày truyền thống đào tạo nguồn nhân lực ngành ngân hàng."
  },
  {
    name: "Khoa Tài chính",
    url: "https://khoatc.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đào tạo chuyên sâu về quản trị tài chính doanh nghiệp, thị trường chứng khoán."
  },
  {
    name: "Khoa Quản trị kinh doanh",
    url: "https://khoaqtkd.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Cung cấp kiến thức quản trị hiện đại, kỹ năng lãnh đạo và khởi nghiệp."
  },
  {
    name: "Khoa Kế toán - Kiểm toán",
    url: "https://khoaktkt.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đào tạo kế toán viên, kiểm toán viên chuyên nghiệp theo chuẩn mực quốc tế."
  },
  {
    name: "Khoa Hệ thống thông tin quản lý",
    url: "https://khoahtttql.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Sự kết hợp giữa kiến thức kinh tế và công nghệ thông tin trong quản lý."
  },
  {
    name: "Khoa Ngoại ngữ",
    url: "https://khoangoaingu.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đào tạo ngôn ngữ Anh chuyên ngành tài chính ngân hàng và kinh doanh quốc tế."
  },
  {
    name: "Khoa Kinh tế Quốc tế",
    url: "https://khoaktqt.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đào tạo về thương mại quốc tế, logistics và quản trị chuỗi cung ứng."
  },
  {
    name: "Khoa Luật kinh tế",
    url: "https://khoalkt.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Trang bị kiến thức pháp lý trong môi trường kinh doanh và hội nhập."
  },
  {
    name: "Khoa Khoa học - Xã hội",
    url: "https://khoakhxh.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đào tạo các môn khoa học cơ bản, lý luận chính trị và kỹ năng mềm."
  },
  {
    name: "Khoa Khoa học dữ liệu trong kinh doanh",
    url: "https://khoakhdltkd.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Đón đầu xu thế chuyển đổi số với kỹ năng phân tích dữ liệu kinh doanh."
  },
  {
    name: "Khoa Giáo dục thể chất và Quốc phòng",
    url: "https://bomongdtc.hub.edu.vn/",
    icon: <GraduationCap size={24} />,
    description: "Rèn luyện thể chất và tinh thần, kỷ luật cho sinh viên HUB."
  },
];

export const HISTORY_TIMELINE = [
  {
    year: "2020 đến nay",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/26/20250326085755z6442765605666_40dd44e04e50609ca5e451d3950e986a.jpg",
    description:
      "Ngày 09/6/2020, Thống đốc Ngân hàng Nhà nước ký quyết định số 1068/QĐ-NHNN công nhận Hội đồng Trường Đại học Ngân hàng TP. Hồ Chí Minh nhiệm kỳ 2020 -2025. Từ giai đoạn này, Trường Đại học Ngân hàng Tp. Hồ Chí Minh hoạt động theo mô hình quản trị đại học theo luật giáo dục đại học",
  },
  {
    year: "2003 - 2020",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/26/20250326090452z6442812662205_d2cfb019f8affa945d7cc12b6b092275.jpg",
    description:
      "Thủ tướng Chính phủ ký quyết định số 174/2003/QĐ-TTg ngày 20/8/2003, thành lập Trường Đại học Ngân hàng TP. Hồ Chí Minh. Từ đây, Trường Đại học Ngân hàng TP. Hồ Chí Minh chính thức hoạt động là Trường đại học độc lập trực thuộc Ngân hàng Nhà nước Việt Nam",
  },
  {
    year: "1998 - 2003",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/26/20250326085938202503211040542003z.jpg",
    description:
      "Thủ tướng Chính phủ ký quyết định số 30/1998/QĐ-TTg ngày 9/2/1998, thành lập Học viện Ngân hàng trực thuộc Ngân hàng Nhà nước Việt Nam trên cơ sở tổ chức lại Trung tâm Đào tạo và Nghiên cứu khoa học Ngân hàng, trong đó Học viện Ngân hàng - Phân viện TP. Hồ Chí Minh đóng tại TP. Hồ Chí Minh.",
  },
  {
    year: "1993 - 1998",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/21/2025032110474693-98.jpg",
    description:
      "Thủ tướng Chính phủ ký quyết định số: 112/TTg ngày 23/3/1993 thành lập Trung tâm Đào tạo và Nghiên cứu khoa học Ngân hàng trực thuộc Ngân hàng Nhà nước Việt Nam, trong đó có Trung tâm Đào tạo và Nghiên cứu khoa học Ngân hàng - Chi nhánh TPHCM, trên cơ sở nhập hai trường: Trường Cao cấp Nghiệp vụ Ngân hàng TPHCM và Trường Trung học Ngân hàng III Trung ương (Trực thuộc Ngân hàng Nhà nước Việt Nam, tại TPHCM).",
  },
  {
    year: "1986 - 1993",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/26/20250326090650z6442821071933_19260dfa8dccda5113a5d3a7c130811a.jpg",
    description:
      "Tổng giám đốc Ngân hàng Nhà nước Việt Nam ký quyết định số: 169/NH-QĐ ngày 23/3/1986, thành lập Trường Cao cấp nghiệp vụ Ngân hàng - TP. Hồ Chí Minh.",
  },
  {
    year: "1980 - 1986",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/26/20250326090355z6427652151045_b9119b0039e6088c31b096dc4db9458c.jpg",
    description:
      "Thủ tướng Chính phủ ký quyết định số: 149/TTG ngày 8/5/1980, cho phép Cơ sở II Trường Cao cấp Nghiệp vụ Ngân hàng được đào tạo hệ Đại học chính quy chuyên ngành Ngân hàng.",
  },
  {
    year: "1976 - 1980",
    image:
      "https://hub.edu.vn/DATA/IMAGES/2025/03/21/202503211030011976z6425431889823_dd12533007a93f960907b2ea3628db2a.jpg",
    description:
      "Ngày 16/12/1976 Tổng giám đốc Ngân hàng Nhà nước Việt Nam đã ký quyết định số: 1229/NH TCCB thành lập Cơ sở II Trường Cao cấp Nghiệp vụ Ngân hàng và Trường Trung học Ngân hàng 3 TW tại TPHCM. Nhiệm vụ chính là đào tạo hệ trung học chuyên nghiệp, đại học chuyên tu, đại học tại chức, bổ túc sau trung học, đào tạo hệ ngắn hạn về quản lý và nghiệp vụ cho hệ thống ngân hàng mới được thành lập ở các tỉnh phía Nam.",
  },
];

export const LEADER_GENERATIONS = [
  {
    period: "BAN LÃNH ĐẠO ĐƯƠNG NHIỆM",
    year: "2020 đến nay",
    leaders: [
      {
        name: "NGƯT.PGS.TS. ĐOÀN THANH HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222605DOANTHANHHA2.jpg",
        position: "BÍ THƯ ĐẢNG ỦY\nCHỦ TỊCH HỘI ĐỒNG TRƯỜNG",
      },
      {
        name: "PGS. TS. NGUYỄN ĐỨC TRUNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222643NGUYENDUCTRUNG.jpg",
        position:
          "PHÓ BÍ THƯ ĐẢNG ỦY\nPHÓ CHỦ TỊCH HỘI ĐỒNG TRƯỜNG\nHIỆU TRƯỞNG",
      },
      {
        name: "PGS.TS. HẠ THỊ THIỀU DAO",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222705HATHITHIEUDAO.jpg",
        position: "PHÓ HIỆU TRƯỞNG",
      },
      {
        name: "TS. NGUYỄN TRẦN PHÚC",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222727NGUYENTRANPHUC.jpg",
        position: "PHÓ HIỆU TRƯỞNG",
      },
    ],
  },
  {
    period: "6/2020 - 12/2021",
    year: "6/2020 - 12/2021",
    leaders: [
      {
        name: "NGƯT.PGS.TS. ĐOÀN THANH HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222247DOANTHANHHA2.jpg",
        position: "BÍ THƯ ĐẢNG ỦY (TỪ 01/2017)\nCHỦ TỊCH HỘI ĐỒNG TRƯỜNG",
      },
      {
        name: "TS. BÙI HỮU TOÀN",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222318BUIHUUTOAN.jpg",
        position: "BÍ THƯ ĐÁNG ỦY (ĐÉN 01/2021)\nHIỆU TRƯỞNG",
      },
      {
        name: "PGS. TS. NGUYỄC ĐỨC TRUNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222347NGUYENDUCTRUNG.jpg",
        position: "PHÓ HIỆU TRƯỞNG",
      },
      {
        name: "PGS.TS. HẠ THỊ THIỀU DAO",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222410HATHITHIEUDAO.jpg",
        position: "PHÓ HIỆU TRƯỞNG",
      },
      {
        name: "TS. NGUYỄN TRẦN PHÚC",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222453NGUYENTRANPHUC.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n(TỪ 01/2021)",
      },
    ],
  },
  {
    period: "3/2018 - 6/2020",
    year: "3/2018 - 6/2020",
    leaders: [
      {
        name: "TS. BÙI HỮU TOÀN",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221823BUIHUUTOAN.jpg",
        position:
          "BÍ THƯ ĐẢNG ỦY\nQ. HIỆU TRƯỞNG (3/2018 0 10/2019)\nHIỆU TRƯỞNG (10/2019)",
      },
      {
        name: "PGS. TS. NGUYỄN ĐỨC TRUNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221859NGUYENDUCTRUNG.jpg",
        position: "PHÓ HIỆU TRƯỞNG",
      },
      {
        name: "NGƯT.PGS.TS. ĐOÀN THANH HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222003DOANTHANHHA2.jpg",
        position: "PHÓ HIỆU TRƯỞNG",
      },
      {
        name: "PGS. TS. HẠ THỊ THIỀU DAO",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217222146HATHITHIEUDAO.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n(TỪ 4/2020)",
      },
    ],
  },
  {
    period: "2013 - 2018",
    year: "2013 - 2018",
    leaders: [
      {
        name: "NGƯT. PGS. TS. LÝ HOÀNG ÁNH",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221259LYHOANGANH.jpg",
        position: "HIỆU TRƯỞNG\n2013 - 2018",
      },
      {
        name: "PGS. TS. LÊ SĨ ĐỒNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221358LESIDONG.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n2013 - 2017",
      },
      {
        name: "NGƯT.PGS.TS. ĐOÀN THANH HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221504DOANTHANHHA.jpg",
        position: "Phó Hiệu trưởng\n2014 - 2018",
      },
      {
        name: "ThS. LÊ TẤN PHÁT",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221526LETANPHAT.jpg",
        position: "Phó Hiệu trưởng\n2013 - 2016",
      },
    ],
  },
  {
    period: "2008 - 2013",
    year: "2008 - 2013",
    leaders: [
      {
        name: "NGND. PGS. TS. NGÔ HƯỚNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220843NGOHUONG.jpg",
        position: "HIỆU TRƯỞNG\n2008 - 2013",
      },
      {
        name: "NGƯT.TS. HỒ DIỆU",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220924HODIEU.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n2008 - 2013",
      },
      {
        name: "NGƯT.PGS.TS. NGUYỄN THỊ NHUNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220953NGUYENTHINHUNG.jpg",
        position: "Phó Hiệu trưởng\n2008 - 2012",
      },
      {
        name: "ThS. LÊ TẤN PHÁT",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221047LETANPHAT.jpg",
        position: "Phó Hiệu trưởng\n2008 - 2013",
      },
      {
        name: "PGS. TS. LÝ HOÀNG ÁNH",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217221150LYHOANGANH.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n2011 - 2013",
      },
    ],
  },
  {
    period: "2003 - 2008",
    year: "2003 - 2008",
    leaders: [
      {
        name: "NGND.TS. NGUYỄN VĂN HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220632NGUYENVANHA.jpg",
        position: "HIỆU TRƯỞNG\n2003 - 2008",
      },
      {
        name: "NGND. PGS. TS. NGÔ HƯỚNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220656NGOHUONG.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n2003 - 2008",
      },
      {
        name: "NGƯT.TS. HỒ DIỆU",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220727HODIEU.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n2003 - 2008",
      },
      {
        name: "NGƯT.PGS.TS. NGUYỄN THỊ NHUNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217220758NGUYENTHINHUNG.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n2003 - 2008",
      },
    ],
  },
  {
    period: "1998 - 2003",
    year: "1998 - 2003",
    leaders: [
      {
        name: "NGND.TS. NGUYỄN VĂN HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217214056NGUYENVANHA.jpg",
        position: "GIÁM ĐỐC\n1998 - 2003",
      },
      {
        name: "NGND. PGS. TS. NGÔ HƯỚNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217214126NGOHUONG.jpg",
        position: "PHÓ GIÁM ĐỐC\n1998 - 2003",
      },
      {
        name: "NGƯT.TS. HỒ DIỆU",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217214155HODIEU.jpg",
        position: "PHÓ GIÁM ĐỐC\n1998 - 2003",
      },
      {
        name: "CÔ NGUYỄN THỊ ẢNH",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217214220NGUYENTHIANH.jpg",
        position: "PHÓ GIÁM ĐỐC\n1998 - 1999",
      },
      {
        name: "NGƯT.PGS.TS. NGUYỄN THỊ NHUNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217214328NGUYENTHINHUNG.jpg",
        position: "PHÓ GIÁM ĐỐC\n1999 - 2003",
      },
    ],
  },
  {
    period: "1993 - 1998",
    year: "1993 - 1998",
    leaders: [
      {
        name: "NGƯT. TRẦN MINH HOÀNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213530TRANMINHHOANG.jpg",
        position: "GIÁM ĐỐC\n1993 - 1998",
      },
      {
        name: "PGS. TS. LÊ VĂN TỀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213622LEVANTE.jpg",
        position: "PHÓ GIÁM ĐỐC\n1993 - 1994",
      },
      {
        name: "NGND.TS. NGUYỄN VĂN HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213647NGUYENVANHA.jpg",
        position: "PHÓ GIÁM ĐỐC\n1993 - 1998",
      },
      {
        name: "NGND. PGS. TS. NGÔ HƯỚNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213746NGOHUONG.jpg",
        position: "PHÓ GIÁM ĐỐC\n1993 - 1998",
      },
      {
        name: "CÔ NGUYỄN THỊ ẢNH",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213841NGUYENTHIANH.jpg",
        position: "PHÓ GIÁM ĐỐC\n1993 - 1998",
      },
      {
        name: "NGƯT.TS. HỒ DIỆU",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213945HODIEU.jpg",
        position: "PHÓ GIÁM ĐỐC\n1997 - 1998",
      },
    ],
  },
  {
    period: "1976 - 1993",
    year: "1976 - 1993",
    leaders: [
      {
        name: "TS. LÊ ĐÌNH THU",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217212641ledinhthu.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n1976 - 1978",
      },
      {
        name: "THẦY MAI PHÊ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217212847MAIPHE.jpg",
        position: "PHỤ TRÁCH\n1978 - 1982",
      },
      {
        name: "TS. NGUYỄN HỮU PHÙNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213016NGUYENHUUPHUNG.jpg",
        position: "HIỆU TRƯỞNG\n1982 - 1987",
      },
      {
        name: "THẦY NGUYỄN THANH PHONG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213104NGUYENTHANHPHONG.jpg",
        position: "HIỆU TRƯỞNG\n1987 - 1993",
      },
      {
        name: "PGS. TS. LÊ VĂN TỀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213204LEVANTE.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n1981 - 1993",
      },
      {
        name: "NGƯT. TRẦN MINH HOÀNG",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213338TRANMINHHOANG.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n1987 - 1993",
      },
      {
        name: "NGND.TS. NGUYỄN VĂN HÀ",
        image:
          "https://hub.edu.vn/DATA/IMAGES/2025/02/17/20250217213427NGUYENVANHA.jpg",
        position: "PHÓ HIỆU TRƯỞNG\n1987 - 1993",
      },
    ],
  },
];

export const getTimelineData = (historyTimeline: typeof HISTORY_TIMELINE) => 
  historyTimeline.map((item) => ({
    title: item.year,
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="relative w-full lg:col-span-2 overflow-hidden rounded-lg sm:rounded-xl">
          <div className="aspect-[16/10] sm:aspect-[16/9] relative w-full">
            <Image
              src={item.image}
              alt={item.year}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          </div>
        </div>

        <Flex direction="col" justify="center" className="lg:col-span-1">
          <div className="prose prose-sm sm:prose-base md:prose-lg text-foreground leading-relaxed dark:prose-invert max-w-none">
            {item.description ? (
              <TypographyPLargeMuted className="leading-relaxed">
                {item.description}
              </TypographyPLargeMuted>
            ) : (
              <TypographyPSmallMuted className="italic">
                Đang cập nhật thông tin...
              </TypographyPSmallMuted>
            )}
          </div>
        </Flex>
      </div>
    ),
  }));
