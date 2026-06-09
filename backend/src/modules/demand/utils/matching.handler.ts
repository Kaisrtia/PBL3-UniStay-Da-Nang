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
  latitude: unknown;
  longitude: unknown;
  postPurpose: string;
  roomType: string;
  postAmenities?: AmenityRef[] | null;
};

type MatchableDemand = {
  minPrice: unknown;
  maxPrice: unknown;
  minArea?: unknown;
  maxArea?: unknown;
  wardId?: number | null;
  locationRadiusMeters?: unknown;
  isLookingForRoommate: boolean;
  roomType: string;
  pricePriority?: string | null;
  locationPriority?: string | null;
  areaPriority?: string | null;
  roommatePriority?: string | null;
  roomTypePriority?: string | null;
  amenityPriority?: string | null;
  demandAmenities?: AmenityRef[] | null;
  student?: {
    demandAmenities?: AmenityRef[] | null;
  } | null;
  university?: {
    latitude?: unknown;
    longitude?: unknown;
  } | null;
};

const PRIORITY_COEFFICIENTS: Record<string, number> = {
  LOW: 0.2,
  MEDIUM: 0.5,
  HIGH: 0.8
};

const getPriorityCoefficient = (priority?: string | null) => {
  if (!priority) return PRIORITY_COEFFICIENTS.MEDIUM;
  return PRIORITY_COEFFICIENTS[priority] ?? PRIORITY_COEFFICIENTS.MEDIUM;
};

const calculatePriceScore = (
  postPrice: number,
  minPrice: number,
  maxPrice: number
) => {
  if (
    !Number.isFinite(postPrice) ||
    !Number.isFinite(minPrice) ||
    !Number.isFinite(maxPrice) ||
    minPrice < 0 ||
    maxPrice < minPrice ||
    postPrice < minPrice ||
    postPrice > maxPrice
  ) {
    return undefined;
  }

  if (minPrice === maxPrice) {
    return 10;
  }

  const minScore = 7,
    maxScore = 10;

  return (
    minScore +
    (maxScore - minScore) * (1 - (postPrice - minPrice) / (maxPrice - minPrice))
  );
};

const toRadians = (degree: number) => (degree * Math.PI) / 180;

const calculateDistanceMeters = (
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number
) => {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRadians = toRadians(firstLatitude);
  const secondLatitudeRadians = toRadians(secondLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

const calculateLocationScore = (
  post: MatchablePost,
  demand: MatchableDemand
) => {
  const postLatitude = Number(post.latitude);
  const postLongitude = Number(post.longitude);
  const universityLatitude = Number(demand.university?.latitude);
  const universityLongitude = Number(demand.university?.longitude);
  const locationRadiusMeters = Number(demand.locationRadiusMeters);

  if (
    !Number.isFinite(postLatitude) ||
    !Number.isFinite(postLongitude) ||
    !Number.isFinite(universityLatitude) ||
    !Number.isFinite(universityLongitude) ||
    !Number.isFinite(locationRadiusMeters) ||
    locationRadiusMeters <= 0
  ) {
    return 0;
  }

  const distanceMeters = calculateDistanceMeters(
    postLatitude,
    postLongitude,
    universityLatitude,
    universityLongitude
  );

  const minScore = 7,
    maxScore = 10;
  return (
    minScore +
    (maxScore - minScore) * (1 - distanceMeters / locationRadiusMeters)
  );
};

export const calculateScore = (
  post: MatchablePost,
  demand: MatchableDemand
) => {
  const criteria: Array<{ score: number; coefficient: number }> = [];

  // 1. Price
  const postPrice = Number(post.price);
  const minPrice = Number(demand.minPrice);
  const maxPrice = Number(demand.maxPrice);
  const priceScore = calculatePriceScore(postPrice, minPrice, maxPrice);

  if (priceScore === undefined) {
    return 0;
  }

  criteria.push({
    score: Math.max(0, Math.min(priceScore, 10)),
    coefficient: getPriorityCoefficient(demand.pricePriority)
  });

  // 2. Location
  criteria.push({
    score: calculateLocationScore(post, demand),
    coefficient: getPriorityCoefficient(demand.locationPriority)
  });

  // 3. Area
  const postArea = Number(post.area);
  const minArea = demand.minArea !== null ? Number(demand.minArea) : null;
  const maxArea = demand.maxArea !== null ? Number(demand.maxArea) : null;

  let areaScore = 0;

  if (
    minArea !== null &&
    maxArea !== null &&
    postArea >= minArea &&
    postArea <= maxArea
  ) {
    areaScore = 10;
  }

  criteria.push({
    score: areaScore,
    coefficient: getPriorityCoefficient(demand.areaPriority)
  });

  // 4. Roommate purpose. The current rule matches roommate intent only
  const roommateScore =
    (demand.isLookingForRoommate && post.postPurpose === 'FIND_ROOMMATE') ||
    (!demand.isLookingForRoommate && post.postPurpose !== 'FIND_ROOMMATE')
      ? 10
      : 0;
  criteria.push({
    score: roommateScore,
    coefficient: getPriorityCoefficient(demand.roommatePriority)
  });

  // 5. Room type
  criteria.push({
    score: post.roomType === demand.roomType ? 10 : 0,
    coefficient: getPriorityCoefficient(demand.roomTypePriority)
  });

  // 6. Amenities
  const postAmenityIds = new Set(
    (post.postAmenities ?? [])
      .map((item) => Number(item.amenityId ?? item.amenity?.id))
      .filter((item: number) => Number.isInteger(item))
  );
  const demandAmenityIds = (
    demand.student?.demandAmenities ??
    demand.demandAmenities ??
    []
  )
    .map((item) => Number(item.amenityId ?? item.amenity?.id))
    .filter((item: number) => Number.isInteger(item));

  let amenityScore = 0;
  if (postAmenityIds.size > 0 && demandAmenityIds.length > 0) {
    const matchedAmenities = demandAmenityIds.filter((amenityId: number) =>
      postAmenityIds.has(amenityId)
    ).length;
    amenityScore = (matchedAmenities / demandAmenityIds.length) * 10;
  }
  criteria.push({
    score: Math.max(0, Math.min(amenityScore, 10)),
    coefficient: getPriorityCoefficient(demand.amenityPriority)
  });

  const weightedScore = criteria.reduce(
    (total, criterion) => total + criterion.score * criterion.coefficient,
    0
  );
  const maxScore = criteria.reduce(
    (total, criterion) => total + 10 * criterion.coefficient,
    0
  );

  if (maxScore === 0) return 0;

  return Math.min(weightedScore / maxScore, 1);
};
