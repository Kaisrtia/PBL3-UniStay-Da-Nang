const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOCAL_PASSWORD = 'Unistay@123456';

const wards = [
  'Phường Bình Thuận',
  'Phường Hòa Cường Bắc',
  'Phường Hòa Cường Nam',
  'Phường Hòa Thuận Đông',
  'Phường Hòa Thuận Tây',
  'Phường Thanh Bình',
  'Phường Thuận Phước',
  'Phường An Khê',
  'Phường Chính Gián',
  'Phường Hòa Khê',
  'Phường Tân Chính',
  'Phường Thanh Khê Đông',
  'Phường Thanh Khê Tây',
  'Phường An Hải Bắc',
  'Phường Mân Thái',
  'Phường Nại Hiên Đông',
  'Phường Phước Mỹ',
  'Phường Thọ Quang',
  'Phường Hòa Minh',
  'Phường Hòa Hiệp Bắc',
  'Phường Hòa Khánh Bắc',
  'Phường Hòa Khánh Nam'
];

const universities = [
  {
    id: 'DUT',
    name: 'Đại học Bách khoa - Đại học Đà Nẵng',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Nguyễn Lương Bằng',
    houseNumber: '54'
  },
  {
    id: 'DUE',
    name: 'Đại học Kinh tế - Đại học Đà Nẵng',
    wardName: 'Phường Phước Mỹ',
    streetName: 'Ngũ Hành Sơn',
    houseNumber: '71'
  },
  {
    id: 'DUTL',
    name: 'Đại học Duy Tân',
    wardName: 'Phường Thanh Khê Tây',
    streetName: 'Nguyễn Văn Linh',
    houseNumber: '254'
  },
  {
    id: 'VKU',
    name: 'Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn',
    wardName: 'Phường Hòa Cường Nam',
    streetName: 'Nam Kỳ Khởi Nghĩa',
    houseNumber: '470'
  }
];

const amenities = [
  { name: 'WiFi tốc độ cao', aliases: ['Wifi', 'WiFi', 'wifi'] },
  { name: 'Máy giặt', aliases: ['May giat'] },
  { name: 'Chỗ để xe', aliases: ['Cho de xe'] },
  { name: 'Ban công', aliases: ['Ban cong', 'Ban công rộng'] },
  { name: 'Cửa sổ', aliases: ['Cua so'] },
  { name: 'Gác lửng', aliases: ['Gac xep', 'Gác xép'] },
  { name: 'Điều hòa', aliases: ['Dieu hoa', 'Máy lạnh'] },
  { name: 'Tủ lạnh', aliases: ['Tu lanh'] },
  { name: 'Nóng lạnh', aliases: ['Nong lanh'] },
  { name: 'Bếp riêng', aliases: ['Bep rieng'] },
  { name: 'Thang máy', aliases: ['Thang may'] },
  { name: 'Camera an ninh', aliases: ['Camera'] }
];

const imageUrls = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
];

const ensureWard = async (name) => {
  const existing = await prisma.ward.findFirst({ where: { name } });
  if (existing) return existing;

  return prisma.ward.create({ data: { name } });
};

const ensureAmenity = async ({ name, aliases }) => {
  const existing = await prisma.amenity.findFirst({
    where: {
      OR: [{ name }, ...aliases.map((alias) => ({ name: alias }))]
    }
  });

  if (existing) {
    return prisma.amenity.update({
      where: { id: existing.id },
      data: { name }
    });
  }

  return prisma.amenity.create({ data: { name } });
};

const upsertUser = async ({ email, fullName, phone, roles, dob, gender, avatarUrl }) => {
  const hashedPassword = await bcrypt.hash(LOCAL_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      dob: dob ? new Date(dob) : null,
      gender,
      avatarUrl,
      hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      roles
    },
    create: {
      email,
      fullName,
      phone,
      dob: dob ? new Date(dob) : null,
      gender,
      avatarUrl,
      hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      roles
    }
  });
};

const replacePostRelations = async (postId, images, postAmenities) => {
  await prisma.post_image.deleteMany({ where: { postId } });
  await prisma.post_amenity.deleteMany({ where: { postId } });

  await prisma.post_image.createMany({
    data: images.map((imageUrl) => ({ postId, imageUrl }))
  });

  await prisma.post_amenity.createMany({
    data: postAmenities.map((amenityId) => ({
      postId,
      amenityId,
      currentCondition: 'GOOD'
    }))
  });
};

const pickImages = (index) => [
  imageUrls[index % imageUrls.length],
  imageUrls[(index + 2) % imageUrls.length]
];

const pickAmenities = (amenityByName, names) => {
  return names.map((name) => amenityByName.get(name).id);
};

const buildPosts = (wardByName, amenityByName, hostId, adminId) => {
  const templates = [
    ['Phòng trọ gần Đại học Bách khoa', 'Phường Hòa Khánh Bắc', 'ROOM', 'RENT', 24, 2500000, 16.073982, 108.149487, ['WiFi tốc độ cao', 'Máy giặt', 'Chỗ để xe']],
    ['Phòng có gác lửng khu Hòa Minh', 'Phường Hòa Minh', 'ROOM', 'RENT', 28, 3000000, 16.07103, 108.17203, ['Gác lửng', 'WiFi tốc độ cao', 'Cửa sổ']],
    ['Căn hộ mini gần cầu Rồng', 'Phường An Hải Bắc', 'APARTMENT', 'RENT', 32, 5200000, 16.067928, 108.227012, ['Điều hòa', 'Tủ lạnh', 'Thang máy']],
    ['Tìm bạn ở ghép khu Thanh Khê', 'Phường Thanh Khê Tây', 'ROOM', 'FIND_ROOMMATE', 28, 1800000, 16.07084, 108.190297, ['WiFi tốc độ cao', 'Ban công', 'Máy giặt']],
    ['Nhà nguyên căn nhỏ gần biển', 'Phường Phước Mỹ', 'HOUSE', 'RENT', 55, 7500000, 16.06122, 108.24372, ['Bếp riêng', 'Chỗ để xe', 'Camera an ninh']],
    ['Phòng sáng có ban công', 'Phường Bình Thuận', 'ROOM', 'RENT', 22, 2300000, 16.06001, 108.21752, ['Ban công', 'Cửa sổ', 'WiFi tốc độ cao']],
    ['Căn hộ studio full nội thất', 'Phường Hòa Cường Bắc', 'APARTMENT', 'RENT', 35, 5800000, 16.04757, 108.22091, ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh']],
    ['Phòng trọ giá tốt khu An Khê', 'Phường An Khê', 'ROOM', 'RENT', 20, 1900000, 16.06191, 108.18149, ['WiFi tốc độ cao', 'Chỗ để xe', 'Camera an ninh']],
    ['Tìm nữ ở ghép gần Duy Tân', 'Phường Thanh Khê Đông', 'ROOM', 'FIND_ROOMMATE', 26, 1600000, 16.06991, 108.19784, ['Máy giặt', 'Bếp riêng', 'Cửa sổ']],
    ['Nhà nguyên căn cho nhóm sinh viên', 'Phường Hòa Khánh Nam', 'HOUSE', 'RENT', 70, 6800000, 16.05846, 108.15327, ['Chỗ để xe', 'Bếp riêng', 'WiFi tốc độ cao']],
    ['Phòng trọ yên tĩnh khu Mân Thái', 'Phường Mân Thái', 'ROOM', 'RENT', 23, 2400000, 16.08945, 108.24392, ['Cửa sổ', 'Nóng lạnh', 'Camera an ninh']],
    ['Căn hộ dịch vụ gần trung tâm', 'Phường Hòa Thuận Tây', 'APARTMENT', 'RENT', 38, 6200000, 16.0671, 108.2208, ['Thang máy', 'Điều hòa', 'Tủ lạnh']],
    ['Phòng ở ghép khu Chính Gián', 'Phường Chính Gián', 'ROOM', 'FIND_ROOMMATE', 25, 1700000, 16.06452, 108.20118, ['WiFi tốc độ cao', 'Máy giặt', 'Chỗ để xe']],
    ['Phòng rộng gần công viên', 'Phường Tân Chính', 'ROOM', 'RENT', 30, 3200000, 16.06572, 108.21011, ['Ban công', 'Điều hòa', 'Nóng lạnh']],
    ['Căn hộ mini khu Thuận Phước', 'Phường Thuận Phước', 'APARTMENT', 'RENT', 34, 5000000, 16.08403, 108.22014, ['Tủ lạnh', 'Bếp riêng', 'Camera an ninh']],
    ['Nhà nguyên căn gần bến xe', 'Phường Hòa Khê', 'HOUSE', 'RENT', 60, 6500000, 16.05974, 108.18588, ['Chỗ để xe', 'Bếp riêng', 'Máy giặt']],
    ['Phòng trọ có thang máy', 'Phường Hòa Thuận Đông', 'ROOM', 'RENT', 27, 3600000, 16.05431, 108.21418, ['Thang máy', 'WiFi tốc độ cao', 'Điều hòa']],
    ['Tìm bạn ở ghép khu Thọ Quang', 'Phường Thọ Quang', 'ROOM', 'FIND_ROOMMATE', 24, 1500000, 16.1078, 108.25271, ['Cửa sổ', 'Chỗ để xe', 'Máy giặt']],
    ['Căn hộ gần trường Việt Hàn', 'Phường Hòa Cường Nam', 'APARTMENT', 'RENT', 36, 4800000, 16.03683, 108.22441, ['Điều hòa', 'Nóng lạnh', 'WiFi tốc độ cao']],
    ['Phòng trọ gần chợ Thanh Bình', 'Phường Thanh Bình', 'ROOM', 'RENT', 21, 2100000, 16.07318, 108.21387, ['WiFi tốc độ cao', 'Cửa sổ', 'Chỗ để xe']]
  ];

  return templates.map((item, index) => {
    const [title, wardName, roomType, postPurpose, area, price, latitude, longitude, amenityNames] = item;
    const ward = wardByName.get(wardName) ?? wardByName.get('Phường Bình Thuận');

    return {
      id: `pst_seed_${String(index + 1).padStart(3, '0')}`,
      userId: hostId,
      moderatorId: adminId,
      title,
      wardId: ward.id,
      purpose: postPurpose,
      detailAddress: `${12 + index} ${wardName.replace('Phường ', '')}, Đà Nẵng`,
      area,
      price,
      deposit: Math.round(price / 2),
      roomType,
      postPurpose,
      description:
        postPurpose === 'FIND_ROOMMATE'
          ? `${title}. Không gian sinh hoạt gọn gàng, khu vực thuận tiện đi lại, phù hợp với sinh viên muốn chia sẻ chi phí và ưu tiên môi trường sống văn minh.`
          : `${title}. Không gian thoáng, vị trí thuận tiện, phù hợp với sinh viên và người đi làm cần nơi ở ổn định tại Đà Nẵng.`,
      latitude,
      longitude,
      images: pickImages(index),
      amenities: pickAmenities(amenityByName, amenityNames)
    };
  });
};

const main = async () => {
  const wardByName = new Map();
  for (const wardName of wards) {
    const ward = await ensureWard(wardName);
    wardByName.set(ward.name, ward);
  }

  for (const university of universities) {
    const ward = wardByName.get(university.wardName);
    await prisma.university.upsert({
      where: { id: university.id },
      update: {
        name: university.name,
        wardId: ward.id,
        streetName: university.streetName,
        houseNumber: university.houseNumber
      },
      create: {
        id: university.id,
        name: university.name,
        wardId: ward.id,
        streetName: university.streetName,
        houseNumber: university.houseNumber
      }
    });
  }

  const amenityByName = new Map();
  for (const amenityInput of amenities) {
    const amenity = await ensureAmenity(amenityInput);
    amenityByName.set(amenity.name, amenity);
  }

  const student = await upsertUser({
    email: 'student@unistay.local',
    fullName: 'Nguyễn Minh Anh',
    phone: '0900000001',
    dob: '2004-08-12',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    roles: ['USER', 'STUDENT']
  });

  const host = await upsertUser({
    email: 'host@unistay.local',
    fullName: 'Trần Quốc Huy',
    phone: '0900000002',
    dob: '1992-03-24',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    roles: ['USER', 'HOST']
  });

  const admin = await upsertUser({
    email: 'admin@unistay.local',
    fullName: 'Quản trị UniStay',
    phone: '0900000003',
    dob: '1990-01-10',
    gender: 'OTHER',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    roles: ['USER', 'ADMIN']
  });

  await prisma.student.upsert({
    where: { studentId: student.id },
    update: {
      universityId: 'DUT'
    },
    create: {
      studentId: student.id,
      universityId: 'DUT'
    }
  });

  await prisma.host.upsert({
    where: { hostId: host.id },
    update: {
      isVerified: true
    },
    create: {
      hostId: host.id,
      isVerified: true
    }
  });

  const demandAmenityIds = pickAmenities(amenityByName, [
    'WiFi tốc độ cao',
    'Máy giặt',
    'Chỗ để xe',
    'Camera an ninh'
  ]);

  await prisma.student_demand.upsert({
    where: { studentId: student.id },
    update: {
      wardId: wardByName.get('Phường Hòa Khánh Bắc').id,
      universityId: 'DUT',
      minPrice: 1500000,
      maxPrice: 3500000,
      roomType: 'ROOM',
      isLookingForRoommate: true,
      roommateGender: 'ANY',
      rommateCriteria: 'WiFi tốc độ cao, máy giặt, chỗ để xe, an ninh tốt, gần trường'
    },
    create: {
      studentId: student.id,
      wardId: wardByName.get('Phường Hòa Khánh Bắc').id,
      universityId: 'DUT',
      minPrice: 1500000,
      maxPrice: 3500000,
      roomType: 'ROOM',
      isLookingForRoommate: true,
      roommateGender: 'ANY',
      rommateCriteria: 'WiFi tốc độ cao, máy giặt, chỗ để xe, an ninh tốt, gần trường'
    }
  });

  await prisma.demand_amenity.deleteMany({
    where: { studentId: student.id }
  });
  await prisma.demand_amenity.createMany({
    data: demandAmenityIds.map((amenityId) => ({
      studentId: student.id,
      amenityId
    }))
  });

  const posts = buildPosts(wardByName, amenityByName, host.id, admin.id);

  for (const post of posts) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        userId: post.userId,
        moderatorId: post.moderatorId,
        title: post.title,
        wardId: post.wardId,
        purpose: post.purpose,
        detailAddress: post.detailAddress,
        area: post.area,
        price: post.price,
        deposit: post.deposit,
        roomType: post.roomType,
        postPurpose: post.postPurpose,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        status: 'APPROVED',
        rejectionReason: null,
        updatedAt: new Date()
      },
      create: {
        id: post.id,
        userId: post.userId,
        moderatorId: post.moderatorId,
        title: post.title,
        wardId: post.wardId,
        purpose: post.purpose,
        detailAddress: post.detailAddress,
        area: post.area,
        price: post.price,
        deposit: post.deposit,
        roomType: post.roomType,
        postPurpose: post.postPurpose,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        status: 'APPROVED'
      }
    });

    await replacePostRelations(post.id, post.images, post.amenities);
  }

  await prisma.student_favorite_post.upsert({
    where: {
      studentId_postId: {
        studentId: student.id,
        postId: posts[0].id
      }
    },
    update: {},
    create: {
      studentId: student.id,
      postId: posts[0].id
    }
  });

  for (const post of [posts[0], posts[3], posts[8]]) {
    await prisma.accomodation_request.upsert({
      where: {
        postId_userId: {
          postId: post.id,
          userId: student.id
        }
      },
      update: {
        status: 'PENDING',
        updatedAt: new Date()
      },
      create: {
        postId: post.id,
        userId: student.id,
        status: 'PENDING'
      }
    });
  }

  console.log(`Đã khởi tạo ${wards.length} phường, ${amenities.length} tiện ích và ${posts.length} bài đăng đã duyệt.`);
  console.log('student@unistay.local / Unistay@123456');
  console.log('host@unistay.local / Unistay@123456');
  console.log('admin@unistay.local / Unistay@123456');
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
