type AmenityRef = {
  amenityId?: unknown;
  amenity?: {
    id?: unknown;
  } | null;
};

type MatchablePost = {
  price: unknown;
  wardId: number;
  area: unknown;
  postPurpose: string;
  roomType: string;
  postAmenities?: AmenityRef[] | null;
};

type MatchableDemand = {
  minPrice: unknown;
  maxPrice: unknown;
  wardId: number;
  isLookingForRoommate: boolean;
  roomType: string;
  demandAmenities?: AmenityRef[] | null;
  student?: {
    demandAmenities?: AmenityRef[] | null;
  } | null;
};

export const calculateScore = (post: MatchablePost, demand: MatchableDemand) => {
  let score = 0;

  // 1. Price (0.35 weight)
  const postPrice = Number(post.price);
  const minPrice = Number(demand.minPrice);
  const maxPrice = Number(demand.maxPrice);
  
  if (postPrice >= minPrice && postPrice <= maxPrice) {
    score += 0.35;
  } else if (postPrice > maxPrice && postPrice <= maxPrice * 1.2) {
    score += 0.35 * (1 - (postPrice - maxPrice) / (maxPrice * 0.2));
  } else if (postPrice < minPrice && postPrice >= minPrice * 0.8) {
    score += 0.35 * (1 - (minPrice - postPrice) / (minPrice * 0.2));
  }

  // 2. Near University (0.25 weight)
  if (post.wardId === demand.wardId) {
    score += 0.25;
  }

  // 3. Area (0.2 weight)
  // Since demand has no area preference, assume larger is better up to a point, or flat score.
  if (Number(post.area) > 15) {
    score += 0.2;
  } else if (Number(post.area) > 10) {
    score += 0.1;
  }

  // 4. Roommate Gender (0.15 weight)
  // Assuming post.postPurpose identifies roommate search
  if (demand.isLookingForRoommate && post.postPurpose === 'FIND_ROOMMATE') {
    score += 0.15;
  } else if (!demand.isLookingForRoommate && post.postPurpose !== 'FIND_ROOMMATE') {
    score += 0.15;
  }

  // 5. Room Type (0.05 weight)
  if (post.roomType === demand.roomType) {
    score += 0.05;
  }

  const postAmenityIds = new Set(
    (post.postAmenities ?? [])
      .map((item) => Number(item.amenityId ?? item.amenity?.id))
      .filter((item: number) => Number.isInteger(item))
  );
  const demandAmenityIds = (demand.student?.demandAmenities ?? demand.demandAmenities ?? [])
    .map((item) => Number(item.amenityId ?? item.amenity?.id))
    .filter((item: number) => Number.isInteger(item));

  if (postAmenityIds.size > 0 && demandAmenityIds.length > 0) {
    const matchedAmenities = demandAmenityIds.filter((amenityId: number) =>
      postAmenityIds.has(amenityId)
    ).length;
    score += Math.min(0.1, (matchedAmenities / demandAmenityIds.length) * 0.1);
  }

  return Math.min(score, 1);
};
