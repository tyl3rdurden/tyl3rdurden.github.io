[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DocxPath,

    [string]$PdfPath,

    [switch]$SkipPdfCopy
)

$ErrorActionPreference = "Stop"

function Get-DocxParagraphs {
    param([string]$Path)

    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $archive = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $entry = $archive.GetEntry("word/document.xml")
        if ($null -eq $entry) {
            throw "DOCX is missing word/document.xml: $Path"
        }

        $reader = New-Object System.IO.StreamReader($entry.Open())
        try {
            $xml = New-Object xml
            $xml.LoadXml($reader.ReadToEnd())
        }
        finally {
            $reader.Dispose()
        }

        $namespaceManager = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $namespaceManager.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

        return @(
            $xml.SelectNodes("//w:p", $namespaceManager) |
                ForEach-Object {
                    ($_.SelectNodes(".//w:t", $namespaceManager) | ForEach-Object { $_.InnerText }) -join ""
                } |
                Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        )
    }
    finally {
        $archive.Dispose()
    }
}

function Get-RequiredIndex {
    param(
        [string[]]$Paragraphs,
        [string]$Text
    )

    $index = [array]::IndexOf($Paragraphs, $Text)
    if ($index -lt 0) {
        throw "Could not find expected resume line: $Text"
    }

    return $index
}

function Convert-ToSiteFocus {
    param([string]$Text)

    return $Text.Replace(" | ", " $([char]0x00B7) ")
}

function Set-JsonEnglishValue {
    param(
        [string]$EnglishJson,
        [string]$Key,
        [string]$Value
    )

    $escapedKey = [regex]::Escape($Key)
    $jsonValue = ConvertTo-Json -InputObject $Value -Compress
    $pattern = "(?m)(`"$escapedKey`"\s*:\s*)`"(?:\\.|[^`"])*`""
    $matches = [regex]::Matches($EnglishJson, $pattern)

    if ($matches.Count -ne 1) {
        throw "Expected exactly one English localization key '$Key', found $($matches.Count)."
    }

    return [regex]::Replace(
        $EnglishJson,
        $pattern,
        { param($match) $match.Groups[1].Value + $jsonValue },
        1
    )
}

function Add-ProjectValues {
    param(
        [hashtable]$Values,
        [string[]]$Lines,
        [object]$Project,
        [object[]]$Projects
    )

    $projectPrefix = "$($Project.Title) - "
    $projectIndex = -1
    for ($index = 0; $index -lt $Lines.Count; $index++) {
        if ($Lines[$index].StartsWith($projectPrefix, [System.StringComparison]::Ordinal)) {
            $projectIndex = $index
            break
        }
    }

    if ($projectIndex -lt 0) {
        throw "Could not find expected project line: $projectPrefix..."
    }

    $Values[$Project.TitleKey] = $Project.Title
    $Values[$Project.StackKey] = "- " + $Lines[$projectIndex].Substring($projectPrefix.Length)

    $nextProjectIndex = $Lines.Count
    for ($index = $projectIndex + 1; $index -lt $Lines.Count; $index++) {
        foreach ($otherProject in $Projects) {
            if ($Lines[$index].StartsWith("$($otherProject.Title) - ", [System.StringComparison]::Ordinal)) {
                $nextProjectIndex = $index
                break
            }
        }

        if ($nextProjectIndex -ne $Lines.Count) {
            break
        }
    }

    $bullets = @($Lines[($projectIndex + 1)..($nextProjectIndex - 1)])
    if ($bullets.Count -ne $Project.BulletKeys.Count) {
        throw "Project '$($Project.Title)' has $($bullets.Count) bullets in the DOCX, but the site expects $($Project.BulletKeys.Count). Update the site template and importer mapping."
    }

    for ($index = 0; $index -lt $Project.BulletKeys.Count; $index++) {
        $Values[$Project.BulletKeys[$index]] = $bullets[$index]
    }
}

$siteRoot = Split-Path -Parent $PSScriptRoot
$localizationPath = Join-Path $siteRoot "localization.json"
$sitePdfPath = Join-Path $siteRoot "assets\Joon_Ryul_Lee_Resume.pdf"

if (-not (Test-Path -LiteralPath $DocxPath -PathType Leaf)) {
    throw "Master resume DOCX not found: $DocxPath"
}

$paragraphs = Get-DocxParagraphs -Path $DocxPath
$skillsIndex = Get-RequiredIndex -Paragraphs $paragraphs -Text "SKILLS"
$experienceIndex = Get-RequiredIndex -Paragraphs $paragraphs -Text "EXPERIENCE"
$languagesIndex = Get-RequiredIndex -Paragraphs $paragraphs -Text "LANGUAGES"

$expectedSkills = @(
    "Languages: C#, C++, Java",
    "Engines: Unity, Unreal Engine",
    "Source Control: Git, Perforce, SVN",
    "Build & CI: Jenkins, TeamCity"
)
$actualSkills = @($paragraphs[($skillsIndex + 1)..($experienceIndex - 1)])
if (($actualSkills -join "`n") -ne ($expectedSkills -join "`n")) {
    throw "The DOCX skill list changed. Update the site's skill-chip markup before syncing again."
}

$contactParts = @($paragraphs[1] -split "\s+\|\s+")
if ($contactParts.Count -lt 3) {
    throw "Expected phone, address, and email on the second DOCX paragraph."
}

$values = @{
    "phone-address"   = "$($contactParts[0]) $([char]0x00B7) $($contactParts[1])"
    "email-link"      = $contactParts[2]
    "core-focus"      = Convert-ToSiteFocus $paragraphs[2]
    "statement-line1" = $paragraphs[3]
    "statement-line2" = ""
}

$jobs = @(
    @{
        Company = "Nexon Games"; CompanyKey = "company-nexon"; TitleKey = "job-title-nexon"; PeriodKey = "period-nexon"
        Projects = @(
            @{ Title = "Blue Archive"; TitleKey = "project-title-nexon"; StackKey = "tech-stack-nexon"; BulletKeys = @("ba-1", "ba-11", "ba-2", "ba-4", "ba-3") }
        )
    },
    @{
        Company = "5minlab"; CompanyKey = "company-minlab"; TitleKey = "job-title-minlab"; PeriodKey = "period-minlab"
        Projects = @(
            @{ Title = "Unreleased Open World Action RPG"; TitleKey = "project-title-openworld"; StackKey = "tech-stack-openworld"; BulletKeys = @("openworld-gas", "openworld-blueprint") },
            @{ Title = "Unreleased Action RPG"; TitleKey = "project-title-action-rpg"; StackKey = "tech-stack-action-rpg"; BulletKeys = @("action-rpg-prototype", "action-rpg-conversion") },
            @{ Title = "Dinkum Mobile"; TitleKey = "project-title-dingcom"; StackKey = "tech-stack-dingcom"; BulletKeys = @("dingcom-art-support", "dingcom-combat", "dingcom-multiplayer") }
        )
    },
    @{
        Company = "DoubleU Games"; CompanyKey = "company-wgames"; TitleKey = "job-title-wgames"; PeriodKey = "period-wgames"
        Projects = @(
            @{ Title = "Undead World"; TitleKey = "project-title-undead"; StackKey = "tech-stack-undead"; BulletKeys = @("undead-ui-content", "undead-build-system") }
        )
    },
    @{
        Company = "5minlab"; CompanyKey = "company-minlab-smash"; TitleKey = "job-title-minlab-smash"; PeriodKey = "period-minlab-smash"
        Projects = @(
            @{ Title = "Smash Legends"; TitleKey = "project-title-smash"; StackKey = "tech-stack-smash"; BulletKeys = @("smash-legacy-code", "smash-tool-dev", "smash-content-dev") }
        )
    },
    @{
        Company = "Andromeda Games"; CompanyKey = "company-andromeda-hero60"; TitleKey = "job-title-andromeda-hero60"; PeriodKey = "period-andromeda-hero60"
        Projects = @(
            @{ Title = "60 Second Hero"; TitleKey = "project-title-hero60"; StackKey = "tech-stack-hero60"; BulletKeys = @("hero60-dev-cycle", "hero60-unity-tools", "hero60-excel-vba", "hero60-ui-role") }
        )
    },
    @{
        Company = "Andromeda Games"; CompanyKey = "company-andromeda-billiards"; TitleKey = "job-title-andromeda-billiards"; PeriodKey = "period-andromeda-billiards"
        Projects = @(
            @{ Title = "God of Billiards"; TitleKey = "project-title-billiards"; StackKey = "tech-stack-billiards"; BulletKeys = @("billiards-dev-cycle", "billiards-ui-role") }
        )
    }
)

$experienceLines = @($paragraphs[($experienceIndex + 1)..($languagesIndex - 1)])
$monthPattern = "January|February|March|April|May|June|July|August|September|October|November|December"
$jobPattern = "^(?<company>.+?) - (?<title>.+?)(?<period>(?:$monthPattern) \d{4} - (?:(?:$monthPattern) \d{4}|Present))$"
$jobLineIndexes = @()

for ($index = 0; $index -lt $experienceLines.Count; $index++) {
    if ($experienceLines[$index] -match $jobPattern) {
        $jobLineIndexes += $index
    }
}

if ($jobLineIndexes.Count -ne $jobs.Count) {
    throw "Found $($jobLineIndexes.Count) DOCX job blocks, but the site expects $($jobs.Count). Update the importer mapping."
}

for ($jobIndex = 0; $jobIndex -lt $jobs.Count; $jobIndex++) {
    $job = $jobs[$jobIndex]
    $lineIndex = $jobLineIndexes[$jobIndex]
    $line = $experienceLines[$lineIndex]
    if ($line -notmatch $jobPattern) {
        throw "Could not parse DOCX job line: $line"
    }

    if ($Matches.company -ne $job.Company) {
        throw "Expected company '$($job.Company)', found '$($Matches.company)'. Update the importer mapping."
    }

    $values[$job.CompanyKey] = $Matches.company
    $values[$job.TitleKey] = $Matches.title
    $values[$job.PeriodKey] = $Matches.period

    $endIndex = if ($jobIndex + 1 -lt $jobLineIndexes.Count) { $jobLineIndexes[$jobIndex + 1] - 1 } else { $experienceLines.Count - 1 }
    $jobLines = @($experienceLines[($lineIndex + 1)..$endIndex])
    foreach ($project in $job.Projects) {
        Add-ProjectValues -Values $values -Lines $jobLines -Project $project -Projects $job.Projects
    }
}

$json = Get-Content -LiteralPath $localizationPath -Raw -Encoding UTF8
$englishMatch = [regex]::Match($json, '(?s)^(\s*\{\s*"en"\s*:\s*\{)(.*?)(\}\s*,\s*"ko"\s*:)')
if (-not $englishMatch.Success) {
    throw "Could not isolate the English localization object in: $localizationPath"
}

$englishJson = $englishMatch.Groups[2].Value
foreach ($entry in $values.GetEnumerator()) {
    $englishJson = Set-JsonEnglishValue -EnglishJson $englishJson -Key $entry.Key -Value $entry.Value
}

$updatedJson = $json.Substring(0, $englishMatch.Groups[2].Index) + $englishJson + $json.Substring($englishMatch.Groups[2].Index + $englishMatch.Groups[2].Length)
$null = $updatedJson | ConvertFrom-Json
[System.IO.File]::WriteAllText($localizationPath, $updatedJson, (New-Object System.Text.UTF8Encoding($false)))

if (-not $SkipPdfCopy) {
    if (-not (Test-Path -LiteralPath $PdfPath -PathType Leaf)) {
        throw "Generated resume PDF not found: $PdfPath"
    }

    Copy-Item -LiteralPath $PdfPath -Destination $sitePdfPath -Force
}

Push-Location $siteRoot
try {
    & npm.cmd run build:locales
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build:locales failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "Synced portfolio site from master resume:"
Write-Host " - $localizationPath"
if (-not $SkipPdfCopy) {
    Write-Host " - $sitePdfPath"
}
