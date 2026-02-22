import {
  PrismaClient,
  UserRole,
  FeatureKey,
  ScanType,
  AnnotationType,
  AnnotationStatus,
  AssetCategory,
  AssetCondition,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 10;

async function main() {
  console.log("Seeding database...\n");

  // ─── 1. Admin User (upsert) ──────────────────────────────────────────

  const adminEmail = process.env.ADMIN_EMAIL || "admin@eliasimmersive.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const adminHash = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`  Admin user: ${admin.email} (id: ${admin.id})`);

  // ─── 2. Test Organization (upsert) ───────────────────────────────────

  const org = await prisma.organization.upsert({
    where: { slug: "meridian-properties" },
    update: {},
    create: {
      name: "Meridian Properties Group",
      slug: "meridian-properties",
      contactName: "Jordan Avery",
      contactEmail: "jordan@meridianproperties.com",
      isActive: true,
    },
  });

  console.log(`  Organization: ${org.name} (id: ${org.id})`);

  // ─── 3. Enable All Features (upsert) ─────────────────────────────────

  const featureKeys = Object.values(FeatureKey);

  for (const featureKey of featureKeys) {
    await prisma.organizationFeature.upsert({
      where: {
        organizationId_featureKey: {
          organizationId: org.id,
          featureKey,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        featureKey,
        enabledBy: admin.id,
      },
    });
  }

  console.log(`  Features enabled: ${featureKeys.join(", ")}`);

  // ─── 4. Customer User (upsert) ───────────────────────────────────────

  const customerEmail =
    process.env.TEST_CUSTOMER_EMAIL || "customer@meridianproperties.com";
  const customerPassword =
    process.env.TEST_CUSTOMER_PASSWORD || "testpass123";
  const customerHash = await bcrypt.hash(
    customerPassword,
    BCRYPT_SALT_ROUNDS
  );

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: customerHash, organizationId: org.id },
    create: {
      email: customerEmail,
      passwordHash: customerHash,
      firstName: "Jordan",
      lastName: "Avery",
      role: UserRole.CUSTOMER,
      organizationId: org.id,
      isActive: true,
    },
  });

  console.log(`  Customer user: ${customer.email} (id: ${customer.id})`);

  // ─── 5. Property (findFirst + conditional create) ─────────────────────

  let property = await prisma.property.findFirst({
    where: { name: "The Sterling Residence", organizationId: org.id },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        name: "The Sterling Residence",
        address: "742 Evergreen Terrace",
        city: "Springfield",
        state: "IL",
        zipCode: "62704",
        description:
          "Luxury residential property with full 3D digital twin capture.",
        organizationId: org.id,
        isActive: true,
      },
    });
    console.log(`  Property created: ${property.name}`);
  } else {
    console.log(`  Property exists: ${property.name}`);
  }

  // ─── 6. Matterport Scans (findFirst + conditional create) ────────────

  const scanDefs = [
    {
      name: "Main Living Areas",
      matterportSid: "SxQL3iGyoDo",
      description: "Ground floor living room, kitchen, and dining areas.",
      sortOrder: 0,
    },
    {
      name: "Second Floor & Bedrooms",
      matterportSid: "iL4RdJqi2yE",
      description: "Master suite, guest bedrooms, and upstairs hallway.",
      sortOrder: 1,
    },
  ];

  const scans = [];

  for (const def of scanDefs) {
    let scan = await prisma.scan.findFirst({
      where: {
        matterportSid: def.matterportSid,
        propertyId: property.id,
      },
    });

    if (!scan) {
      scan = await prisma.scan.create({
        data: {
          name: def.name,
          type: ScanType.MATTERPORT,
          embedUrl: `https://my.matterport.com/show/?m=${def.matterportSid}`,
          matterportSid: def.matterportSid,
          description: def.description,
          sortOrder: def.sortOrder,
          propertyId: property.id,
          isActive: true,
        },
      });
      console.log(`  Scan created: ${scan.name} (SID: ${def.matterportSid})`);
    } else {
      console.log(`  Scan exists: ${scan.name}`);
    }

    scans.push(scan);
  }

  // ─── 7. Sample Annotations (conditional create) ──────────────────────

  const firstScan = scans[0];
  const existingAnnotations = await prisma.annotation.count({
    where: { scanId: firstScan.id, isActive: true },
  });

  if (existingAnnotations === 0) {
    const annotationDefs = [
      {
        content: "Water stain on ceiling — needs inspection",
        type: AnnotationType.ISSUE,
        color: "#ef4444",
        positionX: 1.5,
        positionY: 2.8,
        positionZ: -0.3,
      },
      {
        content: "Original hardwood flooring, excellent condition",
        type: AnnotationType.NOTE,
        color: "#22c55e",
        positionX: -2.1,
        positionY: 0.1,
        positionZ: 3.4,
      },
      {
        content: "Client requests paint color sample for this wall",
        type: AnnotationType.COMMENT,
        color: "#3b82f6",
        positionX: 0.0,
        positionY: 1.5,
        positionZ: -1.2,
      },
    ];

    for (const def of annotationDefs) {
      await prisma.annotation.create({
        data: {
          content: def.content,
          type: def.type,
          status: AnnotationStatus.OPEN,
          color: def.color,
          positionX: def.positionX,
          positionY: def.positionY,
          positionZ: def.positionZ,
          scanId: firstScan.id,
          authorId: customer.id,
          isActive: true,
        },
      });
    }

    console.log(`  Annotations created: ${annotationDefs.length} on "${firstScan.name}"`);
  } else {
    console.log(`  Annotations exist: ${existingAnnotations} on "${firstScan.name}"`);
  }

  // ─── 8. Embed Config (conditional create) ─────────────────────────────

  const existingEmbed = await prisma.embedConfig.findFirst({
    where: { propertyId: property.id, isActive: true },
  });

  if (!existingEmbed) {
    const apiKey =
      "test-embed-key-" + crypto.randomBytes(16).toString("hex");

    await prisma.embedConfig.create({
      data: {
        apiKey,
        allowedDomains: ["localhost", "*.eliasimmersive.com"],
        brandingColor: "#4a5440",
        showLogo: true,
        propertyId: property.id,
        isActive: true,
      },
    });

    console.log(`  Embed config created (apiKey: ${apiKey})`);
  } else {
    console.log(`  Embed config exists (apiKey: ${existingEmbed.apiKey})`);
  }

  // ─── 9. Asset Items (conditional create) ──────────────────────────────

  const existingAssets = await prisma.assetItem.count({
    where: { propertyId: property.id, isActive: true },
  });

  if (existingAssets === 0) {
    const assetDefs = [
      {
        name: "Restoration Hardware Cloud Sofa",
        roomName: "Living Room",
        category: AssetCategory.FURNITURE,
        condition: AssetCondition.EXCELLENT,
        estimatedValue: 4500.0,
        description: "Three-seat cloud modular sofa in fog linen.",
      },
      {
        name: 'Samsung 65" QLED TV',
        roomName: "Living Room",
        category: AssetCategory.ELECTRONICS,
        condition: AssetCondition.GOOD,
        estimatedValue: 1200.0,
        description: "65-inch 4K QLED smart TV, wall-mounted.",
        brand: "Samsung",
      },
    ];

    for (const def of assetDefs) {
      await prisma.assetItem.create({
        data: {
          name: def.name,
          roomName: def.roomName,
          category: def.category,
          condition: def.condition,
          estimatedValue: def.estimatedValue,
          description: def.description,
          brand: def.brand,
          propertyId: property.id,
          isActive: true,
        },
      });
    }

    console.log(`  Asset items created: ${assetDefs.length}`);
  } else {
    console.log(`  Asset items exist: ${existingAssets}`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────

  console.log(`
${"═".repeat(55)}
  Seed Complete — Test Credentials
${"═".repeat(55)}

  Admin:    ${adminEmail} / ${adminPassword}
  Customer: ${customerEmail} / ${customerPassword}

  Org:      ${org.name} (all features enabled)
  Property: ${property.name} (${scans.length} scans, 3 annotations)

${"═".repeat(55)}
`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
